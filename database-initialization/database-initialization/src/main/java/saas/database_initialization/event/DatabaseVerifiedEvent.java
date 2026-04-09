package saas.database_initialization.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

/**
 * Event published when a database connection is successfully verified.
 * Triggers introspection queries to run asynchronously.
 */
@Getter
public class DatabaseVerifiedEvent extends ApplicationEvent {

    private final UUID databaseId;

    public DatabaseVerifiedEvent(Object source, UUID databaseId) {
        super(source);
        this.databaseId = databaseId;
    }
}
