package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Agent → Server: Query execution result
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class QueryResultMessage {
    private String type = DatabaseMessageType.QUERY_RESULT.name();
    private String requestId;
    private List<Map<String, Object>> data; // Query result rows
    private int rowCount;
    private long executionTimeMs;

    public static QueryResultMessage create(String requestId, List<Map<String, Object>> data, long executionTimeMs) {
        QueryResultMessage msg = new QueryResultMessage();
        msg.setRequestId(requestId);
        msg.setData(data);
        msg.setRowCount(data != null ? data.size() : 0);
        msg.setExecutionTimeMs(executionTimeMs);
        return msg;
    }
}
