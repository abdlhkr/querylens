package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.entities.ConfType;
import Kara.Auth.entities.VerificationCode;
import Kara.Auth.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationCodeService {

    private final VerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    // noRollbackFor: mail SMTP hatası fırlasa bile kod DB'ye kaydolur, işlem geri alınmaz
    @Transactional(noRollbackFor = RuntimeException.class)
    public void generateAndSend(String email, ConfType type) {
        verificationCodeRepository.deleteByEmailAndType(email, type);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setType(type);
        verificationCode.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        verificationCode.setUsed(false);

        verificationCodeRepository.saveAndFlush(verificationCode);

        emailService.sendVerificationCode(email, code, type);
    }

    @Transactional
    public void verify(String email, String code, ConfType type) {
        VerificationCode record = verificationCodeRepository
                .findByEmailAndCodeAndTypeAndUsedFalse(email, code, type)
                .orElseThrow(() -> new AuthException("Geçersiz veya kullanılmış doğrulama kodu", HttpStatus.BAD_REQUEST));

        if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("Doğrulama kodu süresi dolmuş", HttpStatus.BAD_REQUEST);
        }

        record.setUsed(true);
        verificationCodeRepository.save(record);
    }
}
