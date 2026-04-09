package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import saas.database_initialization.client.FastServiceClient;
import saas.database_initialization.dto.query.NaturalLanguageQueryResponse;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.entity.IntrospectionResult;
import saas.database_initialization.enums.ConnectionStatus;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.repository.IntrospectionResultRepository;
import saas.database_initialization.dto.websocket.QueryResultMessage;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Orchestrates the natural language → SQL → execution pipeline
 * with self-healing: if the generated SQL fails, the error + schema
 * are sent back to the LLM for correction (up to MAX_HEAL_ATTEMPTS times).
 * 1. Load DB connection info (type + ownership check)
 * 2. Collect introspection schema text from DB
 * 3. Call fast_service to generate SQL
 * 4. Normalize newlines in generated SQL (replace \n with space)
 * 5. Execute the SQL via WebSocket agent
 * 6. If execution fails → call fast_service /fix to correct SQL → retry (max 3)
 * 7. Return the full result
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NaturalLanguageQueryService {

    private final DatabaseConnectionService databaseConnectionService;
    private final IntrospectionResultRepository introspectionResultRepository;
    private final FastServiceClient fastServiceClient;
    private final DatabaseWebSocketService webSocketService;

    private static final int QUERY_TIMEOUT_SECONDS = 60;
    private static final int MAX_HEAL_ATTEMPTS = 3;

    /**
     * Process a natural language question against a verified user database.
     *
     * @param databaseId UUID of the target database
     * @param userId     Authenticated user ID (for ownership validation)
     * @param question   Natural language question
     * @return {@link NaturalLanguageQueryResponse} with generated SQL + execution
     *         result
     */
    public NaturalLanguageQueryResponse process(UUID databaseId, String userId, String question) {

        // 1. Validate database ownership and status
        DatabaseConnection connection = databaseConnectionService.getConnectionEntity(databaseId);

        if (!connection.getUserId().toString().equals(userId)) {
            throw new BadRequestException("Database not found or access denied");
        }

        if (connection.getStatus() != ConnectionStatus.VERIFIED) {
            throw new BadRequestException(
                    "Database connection is not verified. Please verify from your agent first.");
        }

        if (connection.getDeviceId() == null || !webSocketService.isDeviceConnected(connection.getDeviceId())) {
            return NaturalLanguageQueryResponse.builder()
                    .databaseId(databaseId)
                    .question(question)
                    .success(false)
                    .error("Agent is not connected. Please start your agent and try again.")
                    .errorCode("AGENT_DISCONNECTED")
                    .build();
        }

        // 2. Build schema text from stored introspection results
        List<IntrospectionResult> introspectionResults = introspectionResultRepository.findByDatabaseId(databaseId);

        String dbScheme = introspectionResults.stream()
                .map(result -> "Schema: " + result.getSchemaName() + "\n" + result.getResultText())
                .collect(Collectors.joining("\n\n"));

        if (dbScheme.isBlank()) {
            throw new BadRequestException(
                    "No schema information found for this database. " +
                            "Please wait for introspection to complete or re-verify your database.");
        }

        // 3. Call fast_service to generate initial SQL
        String dbType = connection.getDbType().name();
        String rawSql = fastServiceClient.generateSql(dbType, dbScheme, question);
        String normalizedSql = normalizeSql(rawSql);
        log.info("Initial SQL for execution: {}", normalizedSql);

        // 4. Execute + Self-Healing loop
        int attempt = 0;
        String lastError = null;
        String lastErrorCode = null;

        while (attempt <= MAX_HEAL_ATTEMPTS) {
            try {
                CompletableFuture<QueryResultMessage> futureResult = webSocketService.executeQuery(databaseId,
                        normalizedSql);

                QueryResultMessage result = futureResult.get(QUERY_TIMEOUT_SECONDS, TimeUnit.SECONDS);

                // ✅ Başarılı
                log.info("SQL executed successfully on attempt {}", attempt);
                return NaturalLanguageQueryResponse.builder()
                        .databaseId(databaseId)
                        .question(question)
                        .generatedSql(normalizedSql)
                        .success(true)
                        .data(result.getData())
                        .rowCount(result.getRowCount())
                        .executionTimeMs(result.getExecutionTimeMs())
                        .healAttempts(attempt)
                        .build();

            } catch (Exception e) {
                attempt++;
                lastError = extractErrorMessage(e);
                lastErrorCode = extractErrorCode(e);

                if (attempt > MAX_HEAL_ATTEMPTS) {
                    log.error("SQL execution failed after {} heal attempts. Giving up.", MAX_HEAL_ATTEMPTS);
                    break;
                }

                log.warn("SQL execution failed (attempt {}/{}). Requesting fix from LLM. Error: {}",
                        attempt, MAX_HEAL_ATTEMPTS, lastError);

                try {
                    // LLM'den düzeltme iste
                    String fixedSql = fastServiceClient.fixSql(
                            dbType, dbScheme, normalizedSql, lastError, question);
                    normalizedSql = normalizeSql(fixedSql);
                    log.info("LLM fixed SQL (attempt {}): {}", attempt, normalizedSql);
                } catch (Exception fixEx) {
                    log.error("Failed to get fix from LLM on attempt {}: {}", attempt, fixEx.getMessage());
                    lastError = "Self-healing failed: " + fixEx.getMessage();
                    lastErrorCode = "HEAL_FAILED";
                    break;
                }
            }
        }

        // ❌ Tüm denemelerde başarısız
        return NaturalLanguageQueryResponse.builder()
                .databaseId(databaseId)
                .question(question)
                .generatedSql(normalizedSql)
                .success(false)
                .error(lastError)
                .errorCode(lastErrorCode)
                .healAttempts(Math.min(attempt, MAX_HEAL_ATTEMPTS))
                .build();
    }

    /**
     * Normalize SQL: replace newlines with spaces and collapse whitespace.
     */
    private String normalizeSql(String rawSql) {
        return rawSql.replaceAll("\\r?\\n", " ").replaceAll("\\s{2,}", " ").trim();
    }

    /**
     * Extract a human-readable error message from an exception.
     */
    private String extractErrorMessage(Exception e) {
        if (e instanceof java.util.concurrent.TimeoutException) {
            return "Query execution timed out after " + QUERY_TIMEOUT_SECONDS + " seconds";
        }
        return e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
    }

    /**
     * Extract an error code from an exception.
     */
    private String extractErrorCode(Exception e) {
        if (e instanceof java.util.concurrent.TimeoutException) {
            return "TIMEOUT";
        }
        return "QUERY_ERROR";
    }
}
