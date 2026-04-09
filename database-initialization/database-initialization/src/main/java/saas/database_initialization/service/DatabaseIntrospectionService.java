package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import saas.database_initialization.dto.websocket.QueryResultMessage;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.event.DatabaseVerifiedEvent;
import saas.database_initialization.entity.DatabaseIntrospectionQueries;
import saas.database_initialization.entity.IntrospectionResult;
import saas.database_initialization.repository.DatabaseIntrospectionQueriesRepository;
import saas.database_initialization.repository.IntrospectionResultRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Orchestrates the execution of introspection queries
 * when a new database is verified.
 *
 * Runs asynchronously to avoid blocking the WebSocket handler.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseIntrospectionService {

    private final DatabaseConnectionService databaseConnectionService;
    private final DatabaseIntrospectionQueriesRepository introspectionQueriesRepository;
    private final IntrospectionResultRepository introspectionResultRepository;
    private final DatabaseWebSocketService webSocketService;
    private final IntrospectionResultFormatter formatter;

    private static final int QUERY_TIMEOUT_SECONDS = 30;

    /**
     * Run all introspection queries for a verified database.
     * Triggered by DatabaseVerifiedEvent, runs asynchronously.
     */
    @Async
    @EventListener
    public void onDatabaseVerified(DatabaseVerifiedEvent event) {
        runIntrospection(event.getDatabaseId());
    }

    /**
     * Execute all introspection queries for a given database
     */
    public void runIntrospection(UUID databaseId) {
        log.info("Starting introspection for database: {}", databaseId);

        try {
            // Get database connection to determine dbType
            DatabaseConnection connection = databaseConnectionService.getConnectionEntity(databaseId);

            // Fetch introspection queries for this database type
            List<DatabaseIntrospectionQueries> queries = introspectionQueriesRepository
                    .findByDbType(connection.getDbType());

            if (queries.isEmpty()) {
                log.warn("No introspection queries found for dbType: {}", connection.getDbType());
                return;
            }

            log.info("Found {} introspection queries for dbType: {}",
                    queries.size(), connection.getDbType());

            // Clear previous introspection results for this database (in case of re-init)
            introspectionResultRepository.deleteByDatabaseId(databaseId);

            // Fetch schema names
            List<String> schemas = fetchSchemas(databaseId, connection);
            log.info("Found {} schemas: {}", schemas.size(), schemas);

            // Execute each query for each schema and save results
            for (String schemaName : schemas) {
                for (DatabaseIntrospectionQueries introspectionQuery : queries) {
                    executeAndSave(databaseId, introspectionQuery, schemaName, connection);
                }
            }

            log.info("Introspection completed for database: {}", databaseId);

        } catch (Exception e) {
            log.error("Introspection failed for database: {}", databaseId, e);
        }
    }

    /**
     * Fetches the schemas for a given database
     */
    private List<String> fetchSchemas(UUID databaseId, DatabaseConnection connection) throws Exception {
        saas.database_initialization.enums.DatabaseType dbType = connection.getDbType();
        String query = "";
        
        switch (dbType) {
            case POSTGRESQL:
                query = "SELECT nspname AS schema_name " +
                        "FROM pg_catalog.pg_namespace " +
                        "WHERE nspname NOT LIKE 'pg_%' " +
                        "  AND nspname <> 'information_schema'";
                break;
            case MYSQL:
                // For MySQL, the database name acts as the schema
                return java.util.Collections.singletonList(connection.getDatabaseName());
            // Add other dbTypes here as needed later
            default:
                // Fallback to "public" for unhandled database types
                return java.util.Collections.singletonList("public");
        }

        CompletableFuture<QueryResultMessage> future = webSocketService.executeQuery(databaseId, query);
        // Wait for result
        QueryResultMessage result = future.get(QUERY_TIMEOUT_SECONDS, TimeUnit.SECONDS);

        java.util.List<String> schemas = new java.util.ArrayList<>();
        if (result.getData() != null) {
            for (java.util.Map<String, Object> row : result.getData()) {
                if (row.containsKey("schema_name")) {
                    schemas.add(row.get("schema_name").toString());
                }
            }
        }
        
        if (schemas.isEmpty()) {
            schemas.add("public"); // Default fallback
        }
        
        return schemas;
    }

    /**
     * Execute a single introspection query for a specific schema and save the result
     */
    private void executeAndSave(UUID databaseId, DatabaseIntrospectionQueries introspectionQuery, String schemaName, DatabaseConnection connection) {
        // String replacement for dynamic schema querying (public for PostgreSQL, database_name for MySQL)
        String modifiedQuery = introspectionQuery.getQuery()
                .replace("public", schemaName)
                .replace("database_name", connection.getDatabaseName());
        
        try {
            log.debug("Executing introspection query for schema {}: {}", schemaName, modifiedQuery);

            // Send query to agent via WebSocket
            CompletableFuture<QueryResultMessage> future = webSocketService.executeQuery(databaseId,
                    modifiedQuery);

            // Wait for result
            QueryResultMessage result = future.get(QUERY_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Save result
            IntrospectionResult introspectionResult = new IntrospectionResult();
            introspectionResult.setDatabaseId(databaseId);
            introspectionResult.setSchemaName(schemaName);
            
            String resultText = result.getData() != null ? result.getData().toString() : "[]";
            introspectionResult.setResultText(resultText);
            introspectionResult.setExecutedAt(LocalDateTime.now());

            introspectionResultRepository.save(introspectionResult);

            log.info("Saved introspection result for database: {}, schema: {}, rows: {}",
                    databaseId, schemaName, result.getRowCount());

        } catch (Exception e) {
            log.error("Failed to execute introspection query '{}' for database: {}, schema: {}",
                    modifiedQuery, databaseId, schemaName, e);
        }
    }
}
