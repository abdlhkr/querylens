package Kara.Auth.controller;

import Kara.Auth.dto.AccountStatusResponse;
import Kara.Auth.dto.AuthResponse;
import Kara.Auth.dto.ChangeEmailRequest;
import Kara.Auth.dto.DeleteAccountRequest;
import Kara.Auth.dto.SetPasswordRequest;
import Kara.Auth.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @GetMapping("/status")
    public ResponseEntity<AccountStatusResponse> getStatus(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(accountService.getStatus(UUID.fromString(userId)));
    }

    @PostMapping("/send-set-password-code")
    public ResponseEntity<AuthResponse> sendSetPasswordCode(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.sendSetPasswordCode(UUID.fromString(userId));
        return ResponseEntity.ok(new AuthResponse("Doğrulama kodu e-postanıza gönderildi"));
    }

    @PostMapping("/set-password")
    public ResponseEntity<AuthResponse> setPassword(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody SetPasswordRequest request) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.confirmSetPassword(
                UUID.fromString(userId),
                request.getCode(),
                request.getNewPassword(),
                request.getConfirmPassword());
        return ResponseEntity.ok(new AuthResponse("Şifreniz başarıyla belirlendi"));
    }

    @PostMapping("/send-change-email-code")
    public ResponseEntity<AuthResponse> sendChangeEmailCode(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.sendChangeEmailCode(UUID.fromString(userId));
        return ResponseEntity.ok(new AuthResponse("Doğrulama kodu e-postanıza gönderildi"));
    }

    @PostMapping("/change-email")
    public ResponseEntity<AuthResponse> changeEmail(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody ChangeEmailRequest request) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.confirmChangeEmail(
                UUID.fromString(userId),
                request.getCode(),
                request.getNewEmail());
        return ResponseEntity.ok(new AuthResponse("E-posta adresiniz başarıyla güncellendi"));
    }

    @PostMapping("/send-delete-account-code")
    public ResponseEntity<AuthResponse> sendDeleteAccountCode(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.sendDeleteAccountCode(UUID.fromString(userId));
        return ResponseEntity.ok(new AuthResponse("Hesap silme doğrulama kodu e-postanıza gönderildi"));
    }

    @DeleteMapping
    public ResponseEntity<AuthResponse> deleteAccount(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody DeleteAccountRequest request,
            HttpServletResponse response) {
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        accountService.deleteAccount(UUID.fromString(userId), request.code());
        clearAuthCookies(response);
        return ResponseEntity.ok(new AuthResponse("Hesabınız başarıyla silindi"));
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        ResponseCookie clearRefresh = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/auth/refresh")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());
    }
}
