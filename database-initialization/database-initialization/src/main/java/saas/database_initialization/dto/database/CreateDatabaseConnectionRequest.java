package saas.database_initialization.dto.database;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.DatabaseType;

/**
 * Request DTO for creating a new database connection.
 * NOTE: No password field - password is handled by agent only.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateDatabaseConnectionRequest {

    @NotBlank(message = "Host is required")
    private String host;

    @NotNull(message = "Port is required")
    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    private Integer port;

    @NotBlank(message = "Database name is required")
    private String databaseName;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Database type is required")
    private DatabaseType dbType;

    /**
     * Optional display name for this connection
     */
    private String displayName;

    /**
     * Device ID that will manage this connection (set from header)
     * this will be find by userID every user has one device
     */
    private String deviceId;

    /**
     * User ID (set from header)
     */
    private String userId;
}
