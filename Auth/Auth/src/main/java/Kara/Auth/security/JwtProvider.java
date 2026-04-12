package Kara.Auth.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtProvider {
    private final Long expiration; // 15 dakika şimdilik
    // burda eğer long kullanımı istenirse o zaman constructer injection ile

    public JwtProvider(@Value("${jwt.expiration}") Long expiration) {
        this.expiration = expiration;
    }

    public String generateToken(UUID userId, String role,String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("email",email);

        return Jwts.builder()
                .issuer("auth-service")
                .subject(userId.toString())
                .claims(claims)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    private SecretKey getSignInKey() {
        String secret_key = "?Q>9eSwc2#@HRt(C<z/0YZ[3yH-GIbdL9/o&#-MV}Wl)3ssgXHyq4(^.M9KJ1dK%qvWv0Bq.X-^LJq?@IVR>jF";
        byte[] keyBytes = secret_key.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}
