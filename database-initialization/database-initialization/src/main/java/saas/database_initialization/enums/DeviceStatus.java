package saas.database_initialization.enums;

/**
 * Device connection status
 */
public enum DeviceStatus {
    /**
     * Device created but never connected
     */
    PENDING,

    /**
     * Device currently connected via WebSocket
     */
    ACTIVE,

    /**
     * Device disconnected (can reconnect)
     */
    INACTIVE,

    /**
     * Device manually disabled
     */
    DISABLED
}
