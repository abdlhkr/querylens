package saas.database_initialization.dto.query;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for executing a SQL query
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecuteQueryRequest {

    @NotNull(message = "Database ID is required")
    private UUID databaseId;

    @NotBlank(message = "SQL query is required")
    private String query;
}
