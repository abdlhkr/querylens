package com.bosbeles.gateway_service.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    // Same secret key as auth-service
    private static final String SECRET_KEY = "?Q>9eSwc2#@HRt(C<z/0YZ[3yH-GIbdL9/o&#-MV}Wl)3ssgXHyq4(^.M9KJ1dK%qvWv0Bq.X-^LJq?@IVR>jF";
    private final JwtParser jwtParser;

    public JwtUtil() {
        SecretKey secretKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        this.jwtParser = Jwts.parser()
                .verifyWith(secretKey)
                .requireIssuer("auth-service")
                .build();
    }

    public Claims getClaims(String token) {
        return jwtParser
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUserId(String token) {
        return getClaims(token).getSubject();
    }

    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public String getEmail(String token) {
        return getClaims(token).get("email", String.class);
    }
}
