package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.dto.AccountStatusResponse;
import Kara.Auth.entities.ConfType;
import Kara.Auth.entities.UserCredentials;
import Kara.Auth.repository.RefreshTokenRepository;
import Kara.Auth.repository.UserCredentialRepository;
import Kara.Auth.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final UserCredentialRepository userRepo;
    private final VerificationCodeService verificationCodeService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final RestTemplate restTemplate;

    @Value("${services.user-service.url}")
    private String userServiceUrl;

    @Value("${services.db-service.url}")
    private String dbServiceUrl;

    public AccountStatusResponse getStatus(UUID userId) {
        UserCredentials user = findUser(userId);
        return new AccountStatusResponse(user.isPasswordSet(), user.getEmail());
    }

    @Transactional
    public void sendSetPasswordCode(UUID userId) {
        UserCredentials user = findUser(userId);
        if (user.isPasswordSet()) {
            throw new AuthException("Bu hesapta zaten şifre belirlenmiş", HttpStatus.CONFLICT);
        }
        verificationCodeService.generateAndSend(user.getEmail(), ConfType.SET_PASSWORD);
    }

    @Transactional
    public void confirmSetPassword(UUID userId, String code, String newPassword, String confirmPassword) {
        UserCredentials user = findUser(userId);
        if (user.isPasswordSet()) {
            throw new AuthException("Bu hesapta zaten şifre belirlenmiş", HttpStatus.CONFLICT);
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new AuthException("Şifreler eşleşmiyor", HttpStatus.BAD_REQUEST);
        }
        verificationCodeService.verify(user.getEmail(), code, ConfType.SET_PASSWORD);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordSet(true);
        userRepo.save(user);
    }

    @Transactional
    public void sendChangeEmailCode(UUID userId) {
        UserCredentials user = findUser(userId);
        verificationCodeService.generateAndSend(user.getEmail(), ConfType.CHANGE_EMAIL);
    }

    @Transactional
    public void confirmChangeEmail(UUID userId, String code, String newEmail) {
        UserCredentials user = findUser(userId);
        if (userRepo.findByEmail(newEmail).isPresent()) {
            throw new AuthException("Bu e-posta adresi zaten kullanılıyor", HttpStatus.CONFLICT);
        }
        verificationCodeService.verify(user.getEmail(), code, ConfType.CHANGE_EMAIL);
        user.setEmail(newEmail);
        userRepo.save(user);
    }

    @Transactional
    public void initiateForgotPassword(String email) {
        userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı", HttpStatus.NOT_FOUND));
        verificationCodeService.generateAndSend(email, ConfType.FORGOT_PASSWORD);
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        UserCredentials user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));
        verificationCodeService.verify(email, code, ConfType.FORGOT_PASSWORD);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordSet(true);
        userRepo.save(user);
    }

    @Transactional
    public void sendDeleteAccountCode(UUID userId) {
        UserCredentials user = findUser(userId);
        verificationCodeService.generateAndSend(user.getEmail(), ConfType.DELETE_ACCOUNT);
    }

    @Transactional
    public void deleteAccount(UUID userId, int code) {
        UserCredentials user = findUser(userId);
        verificationCodeService.verify(user.getEmail(), String.format("%06d", code), ConfType.DELETE_ACCOUNT);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(userServiceUrl + "/api/users", HttpMethod.DELETE, request, Void.class);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("User profile not found in user-service for userId: {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete user profile for userId: {}", userId, e);
        }

        try {
            restTemplate.exchange(dbServiceUrl + "/api/devices/user-data", HttpMethod.DELETE, request, Void.class);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("No device/db data found in db-service for userId: {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete device/db data for userId: {}", userId, e);
        }

        refreshTokenRepository.deleteByUser(user);
        verificationCodeRepository.deleteByEmail(user.getEmail());
        userRepo.delete(user);

        log.info("Account fully deleted for userId: {}", userId);
    }

    private UserCredentials findUser(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new AuthException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));
    }
}
