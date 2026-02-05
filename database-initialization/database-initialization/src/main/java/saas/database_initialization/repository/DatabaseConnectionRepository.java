package saas.database_initialization.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.enums.ConnectionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DatabaseConnectionRepository extends JpaRepository<DatabaseConnection, UUID> {

    /**
     * Find all database connections for a user
     */
    List<DatabaseConnection> findByUserId(UUID userId);

    /**
     * Find all database connections for a device
     */
    List<DatabaseConnection> findByDeviceId(UUID deviceId);

    /**
     * Find all database connections for a user with specific status
     */
    List<DatabaseConnection> findByUserIdAndStatus(UUID userId, ConnectionStatus status);

    /**
     * Find a specific database connection by id and userId (for security)
     */
    Optional<DatabaseConnection> findByIdAndUserId(UUID id, UUID userId);

    /**
     * Check if a connection already exists for user with same host, port, and
     * database
     */
    boolean existsByUserIdAndHostAndPortAndDatabaseName(UUID userId, String host, Integer port, String databaseName);
}
