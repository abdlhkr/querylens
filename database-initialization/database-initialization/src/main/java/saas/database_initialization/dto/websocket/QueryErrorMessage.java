package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Agent → Server: Query execution error
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class QueryErrorMessage {
    private String type = DatabaseMessageType.QUERY_ERROR.name();
    private String requestId;
    private String error;
    private String errorCode;

    public static QueryErrorMessage create(String requestId, String error, String errorCode) {
        QueryErrorMessage msg = new QueryErrorMessage();
        msg.setRequestId(requestId);
        msg.setError(error);
        msg.setErrorCode(errorCode);
        return msg;
    }
}
