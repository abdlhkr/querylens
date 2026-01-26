package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.dto.AuthResponse;
import Kara.Auth.dto.LoginRequest;
import Kara.Auth.dto.RegisterRequest;
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


@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class AuthService {
    private final UserCredentialRepository userRepo;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthResponse register(RegisterRequest registerRequest) {

        if (userRepo.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new AuthException("User already exists", HttpStatus.CONFLICT);

        }
        UserCredentials userCredentials = new UserCredentials();
        userCredentials.setEmail(registerRequest.getEmail());
        userCredentials.setPassword(
                bCryptPasswordEncoder.encode(registerRequest.getPassword()));
        userCredentials.setRole(Role.USER);
        userCredentials.setEnabled(true);

        UserCredentials dbUser = userRepo.saveAndFlush(userCredentials);
        return generateTokens(dbUser);
    }

    public AuthResponse login(LoginRequest loginRequest) {
        UserCredentials userCredentials = userRepo
                .findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new AuthException("Email not exists", HttpStatus.NOT_FOUND));
        if (!userCredentials.isEnabled()) {
            throw new AuthException("User is disabled", HttpStatus.FORBIDDEN);
        }

        if (!bCryptPasswordEncoder.matches(
                loginRequest.getPassword(),
                userCredentials.getPassword())) {
            throw new AuthException("Wrong password", HttpStatus.UNAUTHORIZED);
        }
        refreshTokenRepository.deleteByUser(userCredentials);
        refreshTokenRepository.flush(); // that make the delete operation instantly so
        // I dont get an error while trying to create another token
        return generateTokens(userCredentials);
    }

    public AuthResponse refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenService.verifyExpiration(token);
        UserCredentials credentials = refreshToken.getUser();
        refreshTokenRepository.deleteByUser(credentials);
        refreshTokenRepository.flush();
        return generateTokens(credentials);
    }

    public AuthResponse generateTokens(UserCredentials userCredentials) {
        String token = jwtProvider.generateToken(userCredentials.getId(), userCredentials.getRole().toString(),userCredentials.getEmail());
        RefreshToken refreshToken = refreshTokenService.generateRefreshToken(userCredentials);
        return new AuthResponse(token, refreshToken.getToken());
    }
}
