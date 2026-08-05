package com.factory.monitoring.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.WebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketHandler machineWebSocketHandler;

    public WebSocketConfig(WebSocketHandler machineWebSocketHandler) {
        this.machineWebSocketHandler = machineWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(machineWebSocketHandler, "/ws/telemetry")
                .setAllowedOrigins("*");
    }
}
