package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.dto.LoginRequest;
import Kara.Auth.dto.RegisterRequest;
import Kara.Auth.entities.ConfType;
import Kara.Auth.entities.RefreshToken;
import Kara.Auth.entities.Role;
import Kara.Auth.entities.UserCredentials;
import Kara.Auth.repository.RefreshTokenRepository;
import Kara.Auth.repository.UserCredentialRepository;
import Kara.Auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserCredentialRepository userRepo;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationCodeService verificationCodeService;

    public record TokenPair(String accessToken, String refreshToken) {}

    /** E-posta daha önce alınmamışsa kullanıcıyı disabled olarak kaydeder, OTP gönderir. */
    public void initiateRegister(RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new AuthException("User already exists", HttpStatus.CONFLICT);
        }
        UserCredentials user = new UserCredentials();
        user.setEmail(req.getEmail());
        user.setPassword(bCryptPasswordEncoder.encode(req.getPassword()));
        user.setRole(Role.USER);
        user.setEnabled(false);
        userRepo.saveAndFlush(user);
        verificationCodeService.generateAndSend(req.getEmail(), ConfType.REGISTER);
    }

    /** OTP doğrulaması yapar, hesabı aktifleştirir, token çifti döner. */
    public TokenPair verifyRegister(String email, int code) {
        verificationCodeService.verify(email, String.format("%06d", code), ConfType.REGISTER);
        UserCredentials user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));
        user.setEnabled(true);
        return generateTokens(userRepo.save(user));
    }

    /** Şifre doğrulaması yapar, OTP kodu maile gönderir. Token vermez. */
    public void initiateLogin(LoginRequest req) {
        UserCredentials user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new AuthException("Email not found", HttpStatus.NOT_FOUND));
        if (!user.isEnabled()) {
            throw new AuthException("User is disabled", HttpStatus.FORBIDDEN);
        }
        if (!bCryptPasswordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new AuthException("Wrong password", HttpStatus.UNAUTHORIZED);
        }
        verificationCodeService.generateAndSend(req.getEmail(), ConfType.LOGIN);
    }

    /** OTP doğrulaması yapar, token çifti döner. */
    public TokenPair verifyLogin(String email, int code) {
        verificationCodeService.verify(email, String.format("%06d", code), ConfType.LOGIN);
        UserCredentials user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND));
        return generateTokens(user);
    }

    public TokenPair refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenService.verifyExpiration(token);
        return generateTokens(refreshToken.getUser());
    }

    public TokenPair generateTokens(UserCredentials user) {
        String access = jwtProvider.generateToken(user.getId(), user.getRole().toString(), user.getEmail());
        RefreshToken refresh = refreshTokenService.generateRefreshToken(user);
        return new TokenPair(access, refresh.getToken());
    }
}
