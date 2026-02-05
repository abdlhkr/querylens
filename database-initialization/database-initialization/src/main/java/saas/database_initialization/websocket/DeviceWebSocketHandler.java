package saas.database_initialization.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import saas.database_initialization.dto.websocket.ConnectionConfirmationMessage;
import saas.database_initialization.dto.websocket.QueryResultMessage;
import saas.database_initialization.dto.websocket.WebSocketErrorMessage;
import saas.database_initialization.entity.CreateDeviceRegistry;
import saas.database_initialization.entity.Device;
import saas.database_initialization.enums.DeviceStatus;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.CreateDeviceRegistryRepository;
import saas.database_initialization.service.CreateDeviceCodeService;
import saas.database_initialization.service.DatabaseWebSocketService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket handler for device connections
 * Supports two connection modes:
 * 1. First connection with registration code: ws://server/ws/device?code={code}
 * 2. Reconnection with deviceId: ws://server/ws/device?deviceId={deviceId}
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeviceWebSocketHandler extends TextWebSocketHandler {

    private final CreateDeviceCodeService deviceService;
    private final CreateDeviceRegistryRepository registryRepository;
    private final DatabaseWebSocketService databaseWebSocketService;
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established for session: {}", session.getId());

        try {
            // Retrieve pre-validated parameters from session attributes (set by
            // HandshakeInterceptor)
            UUID code = (UUID) session.getAttributes().get("code");
            UUID deviceId = (UUID) session.getAttributes().get("deviceId");

            Device device;

            if (code != null) {
                // First connection with registration code
                device = handleFirstConnection(code, session.getId());
            } else if (deviceId != null) {
                // Reconnection with deviceId
                device = handleReconnection(deviceId, session.getId());
            } else {
                // This should never happen if interceptor works correctly
                log.error("No valid parameters in session attributes - interceptor may have failed");
                sendError(session, "INTERNAL_ERROR", "Authentication parameters missing");
                session.close(CloseStatus.SERVER_ERROR);
                return;
            }

            // Register session for database operations
            databaseWebSocketService.registerSession(device.getConnectionId(), session);

            // Send confirmation message
            sendConfirmation(session, device);
            log.info("Device {} connected successfully", device.getRegisteredDeviceID());

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.warn("Connection failed: {}", e.getMessage());
            sendError(session, e.getErrorCode(), e.getMessage());
            session.close(CloseStatus.BAD_DATA);
        } catch (Exception e) {
            log.error("Unexpected error during connection", e);
            sendError(session, "INTERNAL_ERROR", "An unexpected error occurred");
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    /**
     * Handle first connection with registration code
     * UUID format is already validated by HandshakeInterceptor
     */
    private Device handleFirstConnection(UUID codeUUID, String connectionId) {
        log.info("First connection with code: {}", codeUUID);

        // Find registration
        CreateDeviceRegistry registry = registryRepository.findById(codeUUID)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired registration code"));

        // Check expiration
        if (registry.getExpirationTime().before(new Date())) {
            registryRepository.delete(registry);
            throw new BadRequestException("Registration code has expired");
        }

        // Create device
        Device device = new Device();
        device.setUserID(UUID.fromString(registry.getUserID()));
        device.setStatus(DeviceStatus.ACTIVE);
        device.setConnectionId(connectionId);
        device.setConnectedAt(LocalDateTime.now());
        device.setLastSeenAt(LocalDateTime.now());

        // Save device
        Device savedDevice = deviceService.getDeviceRepository().save(device);

        // Delete registration code
        registryRepository.delete(registry);
        log.info("Device created from registration code: {}", savedDevice.getRegisteredDeviceID());

        return savedDevice;
    }

    /**
     * Handle reconnection with existing deviceId
     * UUID format is already validated by HandshakeInterceptor
     */
    private Device handleReconnection(UUID deviceId, String connectionId) {
        log.info("Reconnection with deviceId: {}", deviceId);

        // Authenticate with deviceId
        return deviceService.authenticateWithDeviceId(deviceId, connectionId);
    }

    /**
     * Send confirmation message to client
     */
    private void sendConfirmation(WebSocketSession session, Device device) throws Exception {
        ConnectionConfirmationMessage message = ConnectionConfirmationMessage.create(
                device.getRegisteredDeviceID(),
                device.getUserID(),
                device.getStatus().name(),
                device.getConnectedAt());

        String json = objectMapper.writeValueAsString(message);
        session.sendMessage(new TextMessage(json));
    }

    /**
     * Send error message to client
     */
    private void sendError(WebSocketSession session, String code, String message) {
        try {
            WebSocketErrorMessage errorMessage = WebSocketErrorMessage.create(code, message);
            String json = objectMapper.writeValueAsString(errorMessage);
            session.sendMessage(new TextMessage(json));
        } catch (Exception e) {
            log.error("Failed to send error message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} - {}", session.getId(), status);

        // Unregister session
        databaseWebSocketService.unregisterSession(session.getId());

        deviceService.handleDisconnect(session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("Received message from {}: {}", session.getId(), payload);

        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String messageType = jsonNode.has("type") ? jsonNode.get("type").asText() : null;

            if (messageType == null) {
                log.warn("Received message without type from {}", session.getId());
                return;
            }

            // Handle database-related messages from agent
            switch (messageType) {
                case "DATABASE_VERIFIED":
                    handleDatabaseVerified(jsonNode);
                    break;

                case "DATABASE_FAILED":
                    handleDatabaseFailed(jsonNode);
                    break;

                case "QUERY_RESULT":
                    handleQueryResult(jsonNode);
                    break;

                case "QUERY_ERROR":
                    handleQueryError(jsonNode);
                    break;

                case "PONG":
                    log.debug("Received PONG from {}", session.getId());
                    break;

                default:
                    log.debug("Received unknown message type: {} from {}", messageType, session.getId());
            }

        } catch (Exception e) {
            log.error("Error processing message from {}: {}", session.getId(), e.getMessage());
        }
    }

    private void handleDatabaseVerified(JsonNode jsonNode) {
        UUID databaseId = UUID.fromString(jsonNode.get("databaseId").asText());
        databaseWebSocketService.handleDatabaseVerified(databaseId);
    }

    private void handleDatabaseFailed(JsonNode jsonNode) {
        UUID databaseId = UUID.fromString(jsonNode.get("databaseId").asText());
        String error = jsonNode.has("error") ? jsonNode.get("error").asText() : "Unknown error";
        databaseWebSocketService.handleDatabaseFailed(databaseId, error);
    }

    @SuppressWarnings("unchecked")
    private void handleQueryResult(JsonNode jsonNode) {
        String requestId = jsonNode.get("requestId").asText();
        int rowCount = jsonNode.has("rowCount") ? jsonNode.get("rowCount").asInt() : 0;
        long executionTimeMs = jsonNode.has("executionTimeMs") ? jsonNode.get("executionTimeMs").asLong() : 0;

        List<Map<String, Object>> data = new ArrayList<>();
        if (jsonNode.has("data") && jsonNode.get("data").isArray()) {
            data = objectMapper.convertValue(jsonNode.get("data"), List.class);
        }

        QueryResultMessage result = QueryResultMessage.create(requestId, data, executionTimeMs);
        databaseWebSocketService.handleQueryResult(requestId, result);
    }

    private void handleQueryError(JsonNode jsonNode) {
        String requestId = jsonNode.get("requestId").asText();
        String error = jsonNode.has("error") ? jsonNode.get("error").asText() : "Unknown error";
        String errorCode = jsonNode.has("errorCode") ? jsonNode.get("errorCode").asText() : "UNKNOWN";
        databaseWebSocketService.handleQueryError(requestId, error, errorCode);
    }
}
