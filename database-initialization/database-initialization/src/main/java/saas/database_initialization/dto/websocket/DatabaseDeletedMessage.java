package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Server → Agent: Notify that database was deleted
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DatabaseDeletedMessage {
    private String type = DatabaseMessageType.DATABASE_DELETED.name();
    private UUID databaseId;

    public static DatabaseDeletedMessage create(UUID databaseId) {
        DatabaseDeletedMessage msg = new DatabaseDeletedMessage();
        msg.setDatabaseId(databaseId);
        return msg;
    }
}
