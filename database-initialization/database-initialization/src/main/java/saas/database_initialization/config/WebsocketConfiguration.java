package saas.database_initialization.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
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


    // I was getting an error due to message inbound limit so I add that
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container =
                new ServletServerContainerFactoryBean();

        container.setMaxTextMessageBufferSize(5 * 1024 * 1024); // 5MB
        container.setMaxBinaryMessageBufferSize(5 * 1024 * 1024);

        return container;
    }
}
