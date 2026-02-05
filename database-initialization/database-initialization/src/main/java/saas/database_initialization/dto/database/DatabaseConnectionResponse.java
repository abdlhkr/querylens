package saas.database_initialization.dto.database;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.enums.ConnectionStatus;
import saas.database_initialization.enums.DatabaseType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for database connection
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DatabaseConnectionResponse {

    private UUID id;
    private UUID deviceId;
    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private DatabaseType dbType;
    private ConnectionStatus status;
    private String displayName;
    private String lastError;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime lastUsedAt;

    /**
     * Create response from entity
     */
    public static DatabaseConnectionResponse fromEntity(DatabaseConnection entity) {
        DatabaseConnectionResponse response = new DatabaseConnectionResponse();
        response.setId(entity.getId());
        response.setDeviceId(entity.getDeviceId());
        response.setHost(entity.getHost());
        response.setPort(entity.getPort());
        response.setDatabaseName(entity.getDatabaseName());
        response.setUsername(entity.getUsername());
        response.setDbType(entity.getDbType());
        response.setStatus(entity.getStatus());
        response.setDisplayName(entity.getDisplayName());
        response.setLastError(entity.getLastError());
        response.setCreatedAt(entity.getCreatedAt());
        response.setVerifiedAt(entity.getVerifiedAt());
        response.setLastUsedAt(entity.getLastUsedAt());
        return response;
    }
}
