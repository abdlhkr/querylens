package saas.database_initialization.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import saas.database_initialization.dto.query.ExecuteQueryRequest;
import saas.database_initialization.dto.query.QueryExecutionResponse;
import saas.database_initialization.dto.response.ApiResponse;
import saas.database_initialization.dto.websocket.QueryResultMessage;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.enums.ConnectionStatus;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.service.DatabaseConnectionService;
import saas.database_initialization.service.DatabaseWebSocketService;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * REST controller for executing SQL queries on user databases.
 * Queries are forwarded to the agent via WebSocket.
 */
@Slf4j
@RestController
@RequestMapping("/api/devices/queries")
@RequiredArgsConstructor
public class QueryController {

    private final DatabaseConnectionService databaseService;
    private final DatabaseWebSocketService webSocketService;

    // Query timeout in seconds
    private static final int QUERY_TIMEOUT_SECONDS = 60;

    /**
     * Execute a SQL query on a user's database
     * The query is sent to the agent via WebSocket
     * Agent executes it and returns the result
     * 
     * Response includes originalQuery for self-healing purposes
     */
    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<QueryExecutionResponse>> executeQuery(
            @Valid @RequestBody ExecuteQueryRequest request,
            @RequestHeader("X-User-Id") String userId) {

        log.info("POST /api/devices/queries/execute - User: {}, Database: {}",
                userId, request.getDatabaseId());

        // Validate database belongs to user and is verified
        DatabaseConnection connection = databaseService.getConnectionEntity(request.getDatabaseId());

        if (!connection.getUserId().toString().equals(userId)) {
            throw new BadRequestException("Database not found or access denied");
        }

        if (connection.getStatus() != ConnectionStatus.VERIFIED) {
            throw new BadRequestException("Database connection is not verified. Please verify from your agent first.");
        }

        // Check if agent is connected
        if (!webSocketService.isDeviceConnected(connection.getDeviceId())) {
            return ResponseEntity.ok(ApiResponse.success(
                    QueryExecutionResponse.error(
                            UUID.randomUUID().toString(),
                            request.getDatabaseId(),
                            request.getQuery(),
                            "Agent is not connected. Please start your agent and try again.",
                            "AGENT_DISCONNECTED"),
                    "Query execution failed"));
        }

        try {
            // Send query to agent and wait for result
            CompletableFuture<QueryResultMessage> futureResult = webSocketService.executeQuery(request.getDatabaseId(),
                    request.getQuery());

            // Wait for result with timeout
            QueryResultMessage result = futureResult.get(QUERY_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Build success response
            QueryExecutionResponse response = QueryExecutionResponse.success(
                    result.getRequestId(),
                    request.getDatabaseId(),
                    request.getQuery(), // Include original query
                    result.getData(),
                    result.getExecutionTimeMs());

            log.info("Query executed successfully - RequestId: {}, Rows: {}",
                    result.getRequestId(), result.getRowCount());

            return ResponseEntity.ok(ApiResponse.success(response, "Query executed successfully"));

        } catch (Exception e) {
            log.error("Query execution failed", e);

            // Extract error message
            String errorMessage = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            String errorCode = "QUERY_ERROR";

            if (e instanceof java.util.concurrent.TimeoutException) {
                errorMessage = "Query execution timed out after " + QUERY_TIMEOUT_SECONDS + " seconds";
                errorCode = "TIMEOUT";
            }

            // Build error response with original query for self-healing
            QueryExecutionResponse response = QueryExecutionResponse.error(
                    UUID.randomUUID().toString(),
                    request.getDatabaseId(),
                    request.getQuery(), // Include original query for self-healing
                    errorMessage,
                    errorCode);

            return ResponseEntity.ok(ApiResponse.success(response, "Query execution failed"));
        }
    }

    /**
     * Test database connection without executing a real query
     */
    @PostMapping("/test/{databaseId}")
    public ResponseEntity<ApiResponse<QueryExecutionResponse>> testConnection(
            @PathVariable UUID databaseId,
            @RequestHeader("X-User-Id") String userId) {

        log.info("POST /api/devices/queries/test/{} - User: {}", databaseId, userId);

        // Use a simple test query
        ExecuteQueryRequest request = new ExecuteQueryRequest(databaseId, "SELECT 1");
        return executeQuery(request, userId);
    }
}
