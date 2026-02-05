package saas.database_initialization.websocket;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.UUID;

/**
 * HandshakeInterceptor for WebSocket device authentication
 * Performs pre-connection format validation before the WebSocket connection is
 * established
 * Validates query parameters and UUID format without database access
 */
@Slf4j
@Component
public class DeviceAuthInterceptor implements HandshakeInterceptor {

    private static final String CODE_PARAM = "code";
    private static final String DEVICE_ID_PARAM = "deviceId";
    private static final String CODE_ATTRIBUTE = "code";
    private static final String DEVICE_ID_ATTRIBUTE = "deviceId";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,@NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler,@NonNull Map<String, Object> attributes){

        log.debug("Intercepting WebSocket handshake from: {}", request.getRemoteAddress());

        try {
            // Extract query string
            String query = request.getURI().getQuery();

            if (query == null || query.isEmpty()) {
                log.warn("Rejected connection: Missing query parameters from {}", request.getRemoteAddress());
                response.setStatusCode(HttpStatus.BAD_REQUEST);
                return false;
            }

            // Parse query parameters
            String code = getQueryParam(query, CODE_PARAM);
            String deviceId = getQueryParam(query, DEVICE_ID_PARAM);

            // Validate that at least one parameter is provided
            if ((code == null || code.isEmpty()) && (deviceId == null || deviceId.isEmpty())) {
                log.warn("Rejected connection: Neither 'code' nor 'deviceId' parameter provided from {}",
                        request.getRemoteAddress());
                response.setStatusCode(HttpStatus.BAD_REQUEST);
                return false;
            }

            // Validate and store code parameter
            if (code != null && !code.isEmpty()) {
                try {
                    UUID codeUUID = UUID.fromString(code);
                    attributes.put(CODE_ATTRIBUTE, codeUUID);
                    log.debug("Valid code format received: {}", code);
                } catch (IllegalArgumentException e) {
                    log.warn("Rejected connection: Invalid code UUID format '{}' from {}",
                            code, request.getRemoteAddress());
                    response.setStatusCode(HttpStatus.BAD_REQUEST);
                    return false;
                }
            }

            // Validate and store deviceId parameter
            if (deviceId != null && !deviceId.isEmpty()) {
                try {
                    UUID deviceIdUUID = UUID.fromString(deviceId);
                    attributes.put(DEVICE_ID_ATTRIBUTE, deviceIdUUID);
                    log.debug("Valid deviceId format received: {}", deviceId);
                } catch (IllegalArgumentException e) {
                    log.warn("Rejected connection: Invalid deviceId UUID format '{}' from {}",
                            deviceId, request.getRemoteAddress());
                    response.setStatusCode(HttpStatus.BAD_REQUEST);
                    return false;
                }
            }

            log.info("Handshake validation passed for connection from {}", request.getRemoteAddress());
            return true;

        } catch (Exception e) {
            log.error("Unexpected error during handshake validation from {}: {}",
                    request.getRemoteAddress(), e.getMessage(), e);
            response.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return false;
        }
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request,@NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("Error after handshake from {}: {}", request.getRemoteAddress(), exception.getMessage());
        } else {
            log.debug("Handshake completed successfully for {}", request.getRemoteAddress());
        }
    }

    /**
     * Extract query parameter from query string
     */
    private String getQueryParam(String query, String paramName) {
        if (query == null) {
            return null;
        }

        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2 && keyValue[0].equals(paramName)) {
                return keyValue[1];
            }
        }
        return null;
    }
}
