package saas.database_initialization.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import saas.database_initialization.websocket.DeviceWebSocketHandler;

@Configuration
@EnableWebSocket
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebsocketConfiguration implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

    private final DeviceWebSocketHandler deviceWebSocketHandler;

    // STOMP configuration for message broker
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    // WebSocket handler for device authentication
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(deviceWebSocketHandler, "/ws/device")
                .setAllowedOrigins("*");
    }
}
