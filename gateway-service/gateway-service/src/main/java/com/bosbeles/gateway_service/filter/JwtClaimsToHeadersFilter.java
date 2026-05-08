package com.bosbeles.gateway_service.filter;

import com.bosbeles.gateway_service.util.JwtUtil;
import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtClaimsToHeadersFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public JwtClaimsToHeadersFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Skip validation for auth endpoints and OAuth2 callback paths
        // /login/oauth2/** → Google callback (kod bu path'e döner, henüz cookie yoktur)
        // /oauth2/** → Spring Security'nin Google'a yönlendirme path'i
        if (path.startsWith("/auth/login")
                || path.startsWith("/auth/register")
                || path.startsWith("/auth/refresh")
                || path.startsWith("/auth/logout")
                || path.startsWith("/ws/device")
                || path.startsWith("/login/oauth2/")
                || path.startsWith("/oauth2/")) {
            return chain.filter(exchange);
        }

        // Read token from HttpOnly cookie instead of Authorization header
        var accessTokenCookie = exchange.getRequest().getCookies().getFirst("access_token");
        String token = accessTokenCookie != null ? accessTokenCookie.getValue() : null;

        if (token == null) {
            // For API endpoints, require token
            if (path.startsWith("/api/")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        }

        try {
            Claims claims = jwtUtil.getClaims(token);

            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            String email = claims.get("email", String.class);

            if (userId == null || role == null) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Role", role)
                    .header("X-User-Email", email != null ? email : "")
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

    }

    @Override
    public int getOrder() {
        return -1; // Execute early
    }
}
