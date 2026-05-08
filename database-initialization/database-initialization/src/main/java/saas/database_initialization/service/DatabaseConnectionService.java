package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import saas.database_initialization.dto.database.CreateDatabaseConnectionRequest;
import saas.database_initialization.dto.database.DatabaseConnectionResponse;
import saas.database_initialization.dto.database.UpdateDatabaseConnectionRequest;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.entity.Device;
import saas.database_initialization.enums.ConnectionStatus;
import saas.database_initialization.exception.ConflictException;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.DatabaseConnectionRepository;
import saas.database_initialization.repository.DeviceRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing database connections
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseConnectionService {

    private final DatabaseConnectionRepository repository;
    private final DeviceRepository deviceRepository;

    /**
     * Create a new database connection (without password)
     * Device is found automatically by userId (each user has one device)
     */
    public DatabaseConnectionResponse createConnection(CreateDatabaseConnectionRequest request) {
        log.info("Creating database connection for user: {}", request.getUserId());

        UUID userId = UUID.fromString(request.getUserId());

        // Find device by userId - each user has one device
        Device device = deviceRepository.findByUserID(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No device found for user. Please connect your agent first."));

        // Check for duplicate
        if (repository.existsByUserIdAndHostAndPortAndDatabaseName(
                userId, request.getHost(), request.getPort(), request.getDatabaseName())) {
            throw new ConflictException(
                    "Database connection already exists for this host, port, and database combination");
        }

        DatabaseConnection connection = new DatabaseConnection();
        connection.setUserId(userId);
        connection.setDeviceId(device.getRegisteredDeviceID());
        connection.setHost(request.getHost());
        connection.setPort(request.getPort());
        connection.setDatabaseName(request.getDatabaseName());
        connection.setUsername(request.getUsername());
        connection.setDbType(request.getDbType());
        connection.setDisplayName(request.getDisplayName());
        connection.setStatus(ConnectionStatus.PENDING);

        DatabaseConnection saved = repository.save(connection);
        log.info("Database connection created: {} for user: {}, device: {}",
                saved.getId(), request.getUserId(), device.getRegisteredDeviceID());

        return DatabaseConnectionResponse.fromEntity(saved);
    }

    /**
     * Get all database connections for a user
     */
    public List<DatabaseConnectionResponse> getUserConnections(String userId) {
        log.info("Getting database connections for user: {}", userId);

        List<DatabaseConnection> connections = repository.findByUserId(UUID.fromString(userId));

        return connections.stream()
                .map(DatabaseConnectionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific database connection
     */
    public DatabaseConnectionResponse getConnection(String userId, UUID connectionId) {
        log.info("Getting database connection: {} for user: {}", connectionId, userId);

        DatabaseConnection connection = repository.findByIdAndUserId(connectionId, UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        return DatabaseConnectionResponse.fromEntity(connection);
    }

    /**
     * Update a database connection
     */
    public DatabaseConnectionResponse updateConnection(String userId, UUID connectionId,
            UpdateDatabaseConnectionRequest request) {
        log.info("Updating database connection: {} for user: {}", connectionId, userId);

        DatabaseConnection connection = repository.findByIdAndUserId(connectionId, UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        // Update only provided fields
        if (request.getHost() != null) {
            connection.setHost(request.getHost());
        }
        if (request.getPort() != null) {
            connection.setPort(request.getPort());
        }
        if (request.getDatabaseName() != null) {
            connection.setDatabaseName(request.getDatabaseName());
        }
        if (request.getUsername() != null) {
            connection.setUsername(request.getUsername());
        }
        if (request.getDbType() != null) {
            connection.setDbType(request.getDbType());
        }
        if (request.getDisplayName() != null) {
            connection.setDisplayName(request.getDisplayName());
        }

        // Reset status to PENDING when connection details change
        if (request.getHost() != null || request.getPort() != null ||
                request.getDatabaseName() != null || request.getUsername() != null) {
            connection.setStatus(ConnectionStatus.PENDING);
            connection.setVerifiedAt(null);
        }

        DatabaseConnection saved = repository.save(connection);
        log.info("Database connection updated: {}", connectionId);

        return DatabaseConnectionResponse.fromEntity(saved);
    }

    /**
     * Delete a database connection
     */
    public void deleteConnection(String userId, UUID connectionId) {
        log.info("Deleting database connection: {} for user: {}", connectionId, userId);

        DatabaseConnection connection = repository.findByIdAndUserId(connectionId, UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        repository.delete(connection);
        log.info("Database connection deleted: {}", connectionId);
    }

    /**
     * Mark connection as verified (called when agent confirms successful
     * connection)
     */
    public void markAsVerified(UUID connectionId) {
        log.info("Marking connection as verified: {}", connectionId);

        DatabaseConnection connection = repository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        connection.setStatus(ConnectionStatus.VERIFIED);
        connection.setVerifiedAt(LocalDateTime.now());
        connection.setLastError(null);

        repository.save(connection);
        log.info("Connection verified: {}", connectionId);
    }

    /**
     * Mark connection as failed (called when agent reports connection failure)
     */
    public void markAsFailed(UUID connectionId, String errorMessage) {
        log.info("Marking connection as failed: {} - {}", connectionId, errorMessage);

        DatabaseConnection connection = repository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        connection.setStatus(ConnectionStatus.FAILED);
        connection.setLastError(errorMessage);

        repository.save(connection);
        log.info("Connection marked as failed: {}", connectionId);
    }

    /**
     * Get all connections for a device (used by WebSocket handler)
     */
    public List<DatabaseConnection> getDeviceConnections(UUID deviceId) {
        return repository.findByDeviceId(deviceId);
    }

    /**
     * Get connection entity by ID (used internally)
     */
    public DatabaseConnection getConnectionEntity(UUID connectionId) {
        return repository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));
    }

    /**
     * Reset connection status to PENDING (called before re-sending NEW_DATABASE on agent reconnect)
     */
    public void resetToPending(UUID connectionId) {
        DatabaseConnection connection = repository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        connection.setStatus(ConnectionStatus.PENDING);
        connection.setVerifiedAt(null);
        repository.save(connection);
        log.info("Connection reset to PENDING: {}", connectionId);
    }

    /**
     * Update last used timestamp
     */
    public void updateLastUsed(UUID connectionId) {
        DatabaseConnection connection = repository.findById(connectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Database connection not found"));

        connection.setLastUsedAt(LocalDateTime.now());
        repository.save(connection);
    }
}
