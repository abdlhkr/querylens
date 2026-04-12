package Kara.Auth.controller;

import Kara.Auth.dto.AuthResponse;
import Kara.Auth.dto.LoginRequest;
import Kara.Auth.dto.RegisterRequest;
import Kara.Auth.service.AuthService;
import Kara.Auth.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;


    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpiration;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest registerRequest,
            HttpServletResponse response) {
        AuthService.TokenPair tokens = authService.register(registerRequest);
        addTokenCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse("Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest,
            HttpServletResponse response) {
        AuthService.TokenPair tokens = authService.login(loginRequest);
        addTokenCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse("Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse("Refresh token missing"));
        }
        AuthService.TokenPair tokens = authService.refreshToken(refreshToken);
        addTokenCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse("Token refreshed"));
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletResponse response,
                                               @CookieValue(name = "refresh_token") String refreshToken) {
        refreshTokenService.deleteRefreshToken(refreshToken);
        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        ResponseCookie clearRefresh = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/auth/refresh")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());

        return ResponseEntity.ok(new AuthResponse("Logged out"));
    }

    private void addTokenCookies(HttpServletResponse response, AuthService.TokenPair tokens) {
        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.accessToken())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(Duration.ofMillis(accessTokenExpiration))
                .sameSite("Strict")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", tokens.refreshToken())
                .httpOnly(true)
                .secure(false)
                .path("/auth/refresh")
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
}
