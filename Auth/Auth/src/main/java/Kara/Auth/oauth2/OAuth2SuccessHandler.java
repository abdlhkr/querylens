package Kara.Auth.oauth2;

import Kara.Auth.entities.Role;
import Kara.Auth.entities.UserCredentials;
import Kara.Auth.repository.UserCredentialRepository;
import Kara.Auth.security.JwtProvider;
import Kara.Auth.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

/**
 * Google OAuth2 girişi başarılı olduğunda Spring Security bu sınıfı çağırır.
 *
 * Akış:
 * 1) Google'dan gelen OAuth2User nesnesinden email + googleId al
 * 2) DB'de bu googleId'ye sahip kullanıcı var mı kontrol et
 *    - Varsa: mevcut hesabı kullan
 *    - Yoksa email ile bak → varsa googleId'yi mevcut hesaba bağla
 *    - Hiç yoksa: yeni UserCredentials kaydı oluştur
 * 3) JWT access token + refresh token üret
 * 4) HttpOnly cookie olarak yaz (güvenli, JS erişemez)
 * 5) Frontend'e yönlendir
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserCredentialRepository userRepo;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpiration;

    @Value("${frontend.redirect-url:http://localhost:3000/app}")
    private String frontendRedirectUrl;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Google'ın döndürdüğü temel bilgiler
        // "sub" → Google'ın kullanıcıya verdiği kalıcı unique ID (email değişse bile bu değişmez)
        String googleId = oAuth2User.getAttribute("sub");
        String email    = oAuth2User.getAttribute("email");

        if (email == null || googleId == null) {
            // scope'ta email yoksa bu olabilir — application.properties'te scope=email,profile olmalı
            response.sendError(HttpServletResponse.SC_BAD_REQUEST,
                    "Google hesabından email bilgisi alınamadı. Scope ayarını kontrol edin.");
            return;
        }

        // Kullanıcıyı bul veya oluştur
        UserCredentials user = resolveUser(googleId, email);

        // JWT access token üret
        String accessToken = jwtProvider.generateToken(
                user.getId(), user.getRole().toString(), user.getEmail());

        // Refresh token üret (DB'ye kaydedilir)
        String refreshToken = refreshTokenService.generateRefreshToken(user).getToken();

        // HttpOnly cookie ile access token gönder
        // HttpOnly: JavaScript bu cookie'ye erişemez → XSS koruması
        // SameSite=Lax: cross-site redirect'lerde (OAuth callback) cookie taşınır
        //   (Strict olsaydı Google'dan gelen redirect'te cookie set edilemezdi)
        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(cookieSecure)           // Production'da true yapılacak (HTTPS)
                .path("/")
                .maxAge(Duration.ofMillis(accessTokenExpiration))
                .sameSite("Lax")         // OAuth redirect için Lax, plain login için Strict
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/auth/refresh")   // Sadece refresh endpoint'inden gönderilir
                .maxAge(Duration.ofMillis(refreshTokenExpiration))
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Frontend'e yönlendir
        getRedirectStrategy().sendRedirect(request, response, frontendRedirectUrl);
    }

    /**
     * googleId veya email üzerinden kullanıcıyı bulur, yoksa yeni kullanıcı oluşturur.
     * Bu metot üç senaryoyu yönetir:
     *
     * Senaryo A) Kullanıcı daha önce OAuth ile giriş yapmış  → doğrudan döndür
     * Senaryo B) Email ile kayıtlı ama googleId yok           → googleId bağla
     * Senaryo C) Yepyeni kullanıcı                            → yeni kayıt oluştur
     */
    private UserCredentials resolveUser(String googleId, String email) {

        // Senaryo A: googleId zaten DB'de var
        return userRepo.findByGoogleId(googleId).orElseGet(() ->

            // Senaryo B: email var ama googleId yok (email + şifre ile kayıt olmuş)
            userRepo.findByEmail(email).map(existingUser -> {
                existingUser.setGoogleId(googleId);   // hesabı Google ile bağla
                return userRepo.save(existingUser);
            }).orElseGet(() -> {
                // Senaryo C: Tamamen yeni kullanıcı
                UserCredentials newUser = new UserCredentials();
                newUser.setEmail(email);
                newUser.setGoogleId(googleId);
                newUser.setPassword(null);        // OAuth-only hesap → şifre yok
                newUser.setPasswordSet(false);    // şifre belirlenmemiş bayrağı
                newUser.setRole(Role.USER);
                newUser.setEnabled(true);
                return userRepo.save(newUser);
            })
        );
    }
}
