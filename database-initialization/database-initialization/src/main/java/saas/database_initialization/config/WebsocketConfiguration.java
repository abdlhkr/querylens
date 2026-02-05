package saas.database_initialization.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import saas.database_initialization.websocket.DeviceAuthInterceptor;
import saas.database_initialization.websocket.DeviceWebSocketHandler;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebsocketConfiguration implements  WebSocketConfigurer {

    private final DeviceWebSocketHandler deviceWebSocketHandler;
    private final DeviceAuthInterceptor deviceAuthInterceptor;

    // WebSocket handler for device authentication
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(deviceWebSocketHandler, "/ws/device")
                .addInterceptors(deviceAuthInterceptor)
                .setAllowedOrigins("*");
    }
}
