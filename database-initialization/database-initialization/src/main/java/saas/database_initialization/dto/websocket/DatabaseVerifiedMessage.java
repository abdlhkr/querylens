package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Agent → Server: Database connection verified successfully
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DatabaseVerifiedMessage {
    private String type = DatabaseMessageType.DATABASE_VERIFIED.name();
    private UUID databaseId;

    public static DatabaseVerifiedMessage create(UUID databaseId) {
        DatabaseVerifiedMessage msg = new DatabaseVerifiedMessage();
        msg.setDatabaseId(databaseId);
        return msg;
    }
}
