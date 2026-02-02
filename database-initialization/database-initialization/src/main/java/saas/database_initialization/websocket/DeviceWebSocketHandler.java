package saas.database_initialization.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import saas.database_initialization.dto.websocket.ConnectionConfirmationMessage;
import saas.database_initialization.dto.websocket.WebSocketErrorMessage;
import saas.database_initialization.entity.CreateDeviceRegistry;
import saas.database_initialization.entity.Device;
import saas.database_initialization.enums.DeviceStatus;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.CreateDeviceRegistryRepository;
import saas.database_initialization.service.CreateDeviceCodeService;

import java.time.LocalDateTime;
import java.util.Date;
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
    private final ObjectMapper objectMapper;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection attempt from session: {}", session.getId());

        try {
            String query = session.getUri().getQuery();

            if (query == null || query.isEmpty()) {
                sendError(session, "MISSING_PARAMETER", "Either 'code' or 'deviceId' parameter is required");
                session.close(CloseStatus.BAD_DATA);
                return;
            }

            // Parse query parameters
            String code = getQueryParam(query, "code");
            String deviceIdStr = getQueryParam(query, "deviceId");

            Device device;

            if (code != null && !code.isEmpty()) {
                // First connection with registration code
                device = handleFirstConnection(code, session.getId());
            } else if (deviceIdStr != null && !deviceIdStr.isEmpty()) {
                // Reconnection with deviceId
                device = handleReconnection(deviceIdStr, session.getId());
            } else {
                sendError(session, "MISSING_PARAMETER", "Either 'code' or 'deviceId' parameter is required");
                session.close(CloseStatus.BAD_DATA);
                return;
            }

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
     */
    private Device handleFirstConnection(String code, String connectionId) {
        log.info("First connection with code: {}", code);

        // Validate code format
        UUID codeUUID;
        try {
            codeUUID = UUID.fromString(code);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid code format");
        }

        // Find registration
        CreateDeviceRegistry registry = registryRepository.findById(codeUUID)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired registration code"));

        // Check expiration
        if (registry.getExpirationTime().before(new Date())) {
            registryRepository.delete(registry);
            throw new BadRequestException("Registration code has expired");
        }

        // Create device using existing authenticate method
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
     */
    private Device handleReconnection(String deviceIdStr, String connectionId) {
        log.info("Reconnection with deviceId: {}", deviceIdStr);

        // Validate deviceId format
        UUID deviceId;
        try {
            deviceId = UUID.fromString(deviceIdStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid deviceId format");
        }

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

    /**
     * Extract query parameter from query string
     */
    private String getQueryParam(String query, String paramName) {
        if (query == null)
            return null;

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2 && keyValue[0].equals(paramName)) {
                return keyValue[1];
            }
        }
        return null;
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("WebSocket connection closed: {} - {}", session.getId(), status);
        deviceService.handleDisconnect(session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.debug("Received message from {}: {}", session.getId(), message.getPayload());
        // Handle heartbeat or other messages here if needed
    }
}
