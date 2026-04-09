
package saas.database_initialization.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for natural language query: includes the generated SQL
 * and the full execution result.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NaturalLanguageQueryResponse {
    private UUID databaseId;

    private String generatedSql;
    private String question;
    private String errorCode;
    private boolean success;
    private String error;
    private long executionTimeMs;
    private int healAttempts;
    // Result data (when success = true)
    private List<Map<String, Object>> data;
    private int rowCount;
}