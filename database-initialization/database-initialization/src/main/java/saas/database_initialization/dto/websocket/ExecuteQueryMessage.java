package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Server → Agent: Execute a query on the database
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecuteQueryMessage {
    private String type = DatabaseMessageType.EXECUTE_QUERY.name();
    private UUID databaseId;
    private String requestId; // Unique ID to correlate request/response
    private String query; // SQL query to execute

    public static ExecuteQueryMessage create(UUID databaseId, String requestId, String query) {
        ExecuteQueryMessage msg = new ExecuteQueryMessage();
        msg.setDatabaseId(databaseId);
        msg.setRequestId(requestId);
        msg.setQuery(query);
        return msg;
    }
}
