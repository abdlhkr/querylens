package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import saas.database_initialization.enums.ConnectionStatus;
import saas.database_initialization.enums.DatabaseType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a user's database connection configuration.
 * NOTE: Password is NOT stored here - it's kept only in the agent.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "database_connections")
public class DatabaseConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * The device that will manage this connection
     */
    @Column(nullable = false)
    private UUID deviceId;

    /**
     * Owner of this database connection
     */
    @Column(nullable = false)
    private UUID userId;

    /**
     * Database host address
     */
    @Column(nullable = false)
    private String host;

    /**
     * Database port
     */
    @Column(nullable = false)
    private Integer port;

    /**
     * Database name
     */
    @Column(nullable = false)
    private String databaseName;

    /**
     * Database username for connection
     */
    @Column(nullable = false)
    private String username;

    // ❌ NO PASSWORD FIELD - Password is stored only in the agent

    /**
     * Type of database (POSTGRESQL, MYSQL, etc.)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DatabaseType dbType;

    /**
     * Verification status of this connection
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConnectionStatus status = ConnectionStatus.PENDING;

    /**
     * Optional display name for this connection
     */
    @Column
    private String displayName;

    /**
     * Error message if verification failed
     */
    @Column
    private String lastError;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime verifiedAt;

    @Column
    private LocalDateTime lastUsedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ConnectionStatus.PENDING;
        }
    }
}
