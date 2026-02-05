package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Agent → Server: Database connection verification failed
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DatabaseFailedMessage {
    private String type = DatabaseMessageType.DATABASE_FAILED.name();
    private UUID databaseId;
    private String error;

    public static DatabaseFailedMessage create(UUID databaseId, String error) {
        DatabaseFailedMessage msg = new DatabaseFailedMessage();
        msg.setDatabaseId(databaseId);
        msg.setError(error);
        return msg;
    }
}
