package Kara.Auth.controller;

import Kara.Auth.dto.AccountStatusResponse;
import Kara.Auth.dto.AuthResponse;
import Kara.Auth.dto.ChangeEmailRequest;
import Kara.Auth.dto.SetPasswordRequest;
import Kara.Auth.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

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
}
