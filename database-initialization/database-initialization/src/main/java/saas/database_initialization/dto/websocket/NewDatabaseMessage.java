package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.DatabaseType;

import java.util.UUID;

/**
 * Server → Agent: Notify about new database that needs verification
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class NewDatabaseMessage {
    private String type = DatabaseMessageType.NEW_DATABASE.name();
    private UUID databaseId;
    private String host;
    private Integer port;
    private String databaseName;
    private String username;
    private String password;
    private DatabaseType dbType;

    public static NewDatabaseMessage create(UUID databaseId, String host, Integer port,
            String databaseName, String username, String password, DatabaseType dbType) {
        NewDatabaseMessage msg = new NewDatabaseMessage();
        msg.setDatabaseId(databaseId);
        msg.setHost(host);
        msg.setPort(port);
        msg.setDatabaseName(databaseName);
        msg.setUsername(username);
        msg.setPassword(password);
        msg.setDbType(dbType);
        return msg;
    }
}
