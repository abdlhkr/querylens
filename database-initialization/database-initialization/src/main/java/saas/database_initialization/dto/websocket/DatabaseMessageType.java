package saas.database_initialization.dto.websocket;

/**
 * WebSocket message types for database operations
 */
public enum DatabaseMessageType {
    // Server → Agent
    NEW_DATABASE, // New database added, needs verification
    EXECUTE_QUERY, // Execute a query on the database
    DATABASE_DELETED, // Database was deleted, close connection

    // Agent → Server
    DATABASE_VERIFIED, // Connection verified successfully
    DATABASE_FAILED, // Connection verification failed
    QUERY_RESULT, // Query execution result
    QUERY_ERROR // Query execution error
}
