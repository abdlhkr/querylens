package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Message sent to client when WebSocket connection is established
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionConfirmationMessage {
    private String type = "CONNECTION_CONFIRMED";
    private ConnectionData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectionData {
        private UUID deviceId;
        private UUID userId;
        private String status;
        private LocalDateTime connectedAt;
    }

    public static ConnectionConfirmationMessage create(UUID deviceId, UUID userId, String status,
            LocalDateTime connectedAt) {
        return ConnectionConfirmationMessage.builder()
                .type("CONNECTION_CONFIRMED")
                .data(ConnectionData.builder()
                        .deviceId(deviceId)
                        .userId(userId)
                        .status(status)
                        .connectedAt(connectedAt)
                        .build())
                .build();
    }
}
