package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;


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
        private String connectedAt; // Changed to String for JSON serialization
    }

    public static ConnectionConfirmationMessage create(UUID deviceId, UUID userId, String status,
            LocalDateTime connectedAt) {
        return ConnectionConfirmationMessage.builder()
                .type("CONNECTION_CONFIRMED")
                .data(ConnectionData.builder()
                        .deviceId(deviceId)
                        .userId(userId)
                        .status(status)
                        .connectedAt(connectedAt != null
                                ? connectedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                                : null)
                        .build())
                .build();
    }
}
