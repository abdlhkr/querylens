package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stores the plain text result of an introspection query
 * executed against a user's database after verification.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "introspection_results")
public class IntrospectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The database this introspection belongs to
     */
    @Column(nullable = false)
    private UUID databaseId;

    /**
     * The schema name for this result
     */
    @Column(name = "schema_name", nullable = false)
    private String schemaName;

    /**
     * Plain text formatted result of the introspection query
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String resultText;

    /**
     * When this introspection was executed
     */
    @Column(nullable = false)
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}
