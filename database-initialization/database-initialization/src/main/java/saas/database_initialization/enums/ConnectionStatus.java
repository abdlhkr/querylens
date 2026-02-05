package saas.database_initialization.enums;

/**
 * Database connection verification status
 */
public enum ConnectionStatus {
    /**
     * Waiting for agent to verify the connection
     */
    PENDING,

    /**
     * Connection verified successfully by agent
     */
    VERIFIED,

    /**
     * Connection verification failed
     */
    FAILED
}
