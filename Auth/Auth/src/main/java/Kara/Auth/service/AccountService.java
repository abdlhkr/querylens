package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.dto.AccountStatusResponse;
import Kara.Auth.entities.ConfType;
import Kara.Auth.entities.UserCredentials;
import Kara.Auth.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserCredentialRepository userRepo;
    private final VerificationCodeService verificationCodeService;
    private final BCryptPasswordEncoder passwordEncoder;

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

    private UserCredentials findUser(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new AuthException("Kullanıcı bulunamadı", HttpStatus.NOT_FOUND));
    }
}
