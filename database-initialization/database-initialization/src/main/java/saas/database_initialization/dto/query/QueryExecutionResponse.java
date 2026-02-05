package saas.database_initialization.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for SQL query execution result
 * Includes original query for self-healing purposes
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QueryExecutionResponse {

    private String requestId;
    private UUID databaseId;

    // Original query - useful for self-healing when error occurs
    private String originalQuery;

    // Execution status
    private boolean success;

    // Result data (when success = true)
    private List<Map<String, Object>> data;
    private int rowCount;
    private long executionTimeMs;

    // Error details (when success = false)
    private String error;
    private String errorCode;

    /**
     * Create success response
     */
    public static QueryExecutionResponse success(
            String requestId,
            UUID databaseId,
            String originalQuery,
            List<Map<String, Object>> data,
            long executionTimeMs) {
        return QueryExecutionResponse.builder()
                .requestId(requestId)
                .databaseId(databaseId)
                .originalQuery(originalQuery)
                .success(true)
                .data(data)
                .rowCount(data != null ? data.size() : 0)
                .executionTimeMs(executionTimeMs)
                .build();
    }

    /**
     * Create error response - includes original query for self-healing
     */
    public static QueryExecutionResponse error(
            String requestId,
            UUID databaseId,
            String originalQuery,
            String error,
            String errorCode) {
        return QueryExecutionResponse.builder()
                .requestId(requestId)
                .databaseId(databaseId)
                .originalQuery(originalQuery)
                .success(false)
                .error(error)
                .errorCode(errorCode)
                .build();
    }
}
