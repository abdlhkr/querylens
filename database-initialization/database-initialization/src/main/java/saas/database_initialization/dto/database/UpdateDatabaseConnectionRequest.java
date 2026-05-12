package saas.database_initialization.dto.database;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.DatabaseType;

/**
 * Request DTO for updating a database connection.
 * All fields are optional - only provided fields will be updated.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateDatabaseConnectionRequest {

    private String host;

    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    private Integer port;

    private String databaseName;

    private String username;

    private String password;

    private DatabaseType dbType;

    private String displayName;
}
