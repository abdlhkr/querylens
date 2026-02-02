package saas.database_initialization.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Error message sent to client when WebSocket connection fails
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketErrorMessage {
    private String type = "ERROR";
    private ErrorData error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorData {
        private String code;
        private String message;
    }

    public static WebSocketErrorMessage create(String code, String message) {
        return WebSocketErrorMessage.builder()
                .type("ERROR")
                .error(ErrorData.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }
}
