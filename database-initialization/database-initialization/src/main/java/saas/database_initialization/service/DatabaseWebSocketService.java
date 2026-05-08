package saas.database_initialization.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import saas.database_initialization.dto.websocket.*;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.entity.Device;
import saas.database_initialization.event.DatabaseVerifiedEvent;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.DeviceRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing database-related WebSocket communications.
 * Handles sending messages to connected agents and processing responses.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseWebSocketService {

    private final DeviceRepository deviceRepository;
    private final DatabaseConnectionService databaseConnectionService;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    // Active WebSocket sessions: connectionId -> session
    private final ConcurrentHashMap<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    // Pending query requests: requestId -> CompletableFuture
    private final ConcurrentHashMap<String, CompletableFuture<QueryResultMessage>> pendingQueries = new ConcurrentHashMap<>();

    // Query timeout in seconds
    private static final int QUERY_TIMEOUT_SECONDS = 60;

    /**
     * Register an active WebSocket session
     */
    public void registerSession(String connectionId, WebSocketSession session) {
        activeSessions.put(connectionId, session);
        log.info("Registered WebSocket session: {}", connectionId);
    }

    /**
     * Unregister a WebSocket session
     */
    public void unregisterSession(String connectionId) {
        activeSessions.remove(connectionId);
        log.info("Unregistered WebSocket session: {}", connectionId);
    }

    /**
     * Send NEW_DATABASE message to agent when a new database connection is created
     */
    public void notifyNewDatabase(DatabaseConnection connection) {
        try {
            Device device = deviceRepository.findById(connection.getDeviceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Device not found"));

            WebSocketSession session = activeSessions.get(device.getConnectionId());
            if (session == null || !session.isOpen()) {
                log.warn("Device not connected, cannot notify about new database: {}", connection.getId());
                return;
            }

            NewDatabaseMessage message = NewDatabaseMessage.create(
                    connection.getId(),
                    connection.getHost(),
                    connection.getPort(),
                    connection.getDatabaseName(),
                    connection.getUsername(),
                    connection.getDbType());

            sendMessage(session, message);
            log.info("Sent NEW_DATABASE notification for: {}", connection.getId());

        } catch (Exception e) {
            log.error("Failed to notify agent about new database", e);
        }
    }

    /**
     * Send EXECUTE_QUERY message to agent and wait for result
     */
    public CompletableFuture<QueryResultMessage> executeQuery(UUID databaseId, String query) {
        DatabaseConnection connection = databaseConnectionService.getConnectionEntity(databaseId);

        Device device = deviceRepository.findById(connection.getDeviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Device not found"));

        WebSocketSession session = activeSessions.get(device.getConnectionId());
        if (session == null || !session.isOpen()) {
            CompletableFuture<QueryResultMessage> future = new CompletableFuture<>();
            future.completeExceptionally(new RuntimeException("Device not connected"));
            return future;
        }

        String requestId = UUID.randomUUID().toString();
        CompletableFuture<QueryResultMessage> future = new CompletableFuture<>();
        pendingQueries.put(requestId, future);

        // Set timeout
        CompletableFuture.delayedExecutor(QUERY_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .execute(() -> {
                    if (pendingQueries.remove(requestId) != null) {
                        future.completeExceptionally(new RuntimeException("Query timeout"));
                    }
                });

        try {
            ExecuteQueryMessage message = ExecuteQueryMessage.create(
                    databaseId,
                    requestId,
                    query);

            sendMessage(session, message);
            log.info("Sent EXECUTE_QUERY: {} for database: {}", requestId, databaseId);

            // Update last used time
            databaseConnectionService.updateLastUsed(databaseId);

        } catch (Exception e) {
            pendingQueries.remove(requestId);
            future.completeExceptionally(e);
        }

        return future;
    }

    /**
     * Re-send NEW_DATABASE for all existing connections after agent reconnects.
     * Resets each connection to PENDING so the agent re-verifies using its stored credentials.
     */
    public void notifyExistingDatabases(Device device) {
        List<DatabaseConnection> connections =
                databaseConnectionService.getDeviceConnections(device.getRegisteredDeviceID());

        if (connections.isEmpty()) {
            log.info("No existing databases to notify for device: {}", device.getRegisteredDeviceID());
            return;
        }

        WebSocketSession session = activeSessions.get(device.getConnectionId());
        if (session == null || !session.isOpen()) {
            log.warn("Session not found for device: {}", device.getRegisteredDeviceID());
            return;
        }

        for (DatabaseConnection conn : connections) {
            try {
                databaseConnectionService.resetToPending(conn.getId());

                NewDatabaseMessage message = NewDatabaseMessage.create(
                        conn.getId(),
                        conn.getHost(),
                        conn.getPort(),
                        conn.getDatabaseName(),
                        conn.getUsername(),
                        conn.getDbType());

                sendMessage(session, message);
                log.info("Re-sent NEW_DATABASE for existing connection: {}", conn.getId());
            } catch (Exception e) {
                log.error("Failed to re-notify database: {}", conn.getId(), e);
            }
        }
    }

    /**
     * Send DATABASE_DELETED message to agent
     */
    public void notifyDatabaseDeleted(UUID databaseId, UUID deviceId) {
        try {
            Device device = deviceRepository.findById(deviceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Device not found"));

            WebSocketSession session = activeSessions.get(device.getConnectionId());
            if (session == null || !session.isOpen()) {
                log.warn("Device not connected, cannot notify about deleted database: {}", databaseId);
                return;
            }

            DatabaseDeletedMessage message = DatabaseDeletedMessage.create(databaseId);
            sendMessage(session, message);
            log.info("Sent DATABASE_DELETED notification for: {}", databaseId);

        } catch (Exception e) {
            log.error("Failed to notify agent about deleted database", e);
        }
    }

    /**
     * Handle DATABASE_VERIFIED message from agent
     */
    public void handleDatabaseVerified(UUID databaseId) {
        databaseConnectionService.markAsVerified(databaseId);
        log.info("Database verified: {}", databaseId);

        // Publish event to trigger introspection queries
        eventPublisher.publishEvent(new DatabaseVerifiedEvent(this, databaseId));
    }

    /**
     * Handle DATABASE_FAILED message from agent
     */
    public void handleDatabaseFailed(UUID databaseId, String error) {
        databaseConnectionService.markAsFailed(databaseId, error);
        log.info("Database verification failed: {} - {}", databaseId, error);
    }

    /**
     * Handle QUERY_RESULT message from agent
     */
    public void handleQueryResult(String requestId, QueryResultMessage result) {
        CompletableFuture<QueryResultMessage> future = pendingQueries.remove(requestId);
        if (future != null) {
            future.complete(result);
            log.debug("Query result received: {}", requestId);
        } else {
            log.warn("No pending query found for requestId: {}", requestId);
        }
    }

    /**
     * Handle QUERY_ERROR message from agent
     */
    public void handleQueryError(String requestId, String error, String errorCode) {
        CompletableFuture<QueryResultMessage> future = pendingQueries.remove(requestId);
        if (future != null) {
            future.completeExceptionally(new RuntimeException(error));
            log.debug("Query error received: {} - {}", requestId, error);
        } else {
            log.warn("No pending query found for requestId: {}", requestId);
        }
    }

    /**
     * Send a message to a WebSocket session
     */
    private void sendMessage(WebSocketSession session, Object message) throws IOException {
        String json = objectMapper.writeValueAsString(message);
        session.sendMessage(new TextMessage(json));
    }

    /**
     * Check if a device is connected
     */
    public boolean isDeviceConnected(UUID deviceId) {
        return deviceRepository.findById(deviceId)
                .map(device -> {
                    WebSocketSession session = activeSessions.get(device.getConnectionId());
                    return session != null && session.isOpen();
                })
                .orElse(false);
    }
}
