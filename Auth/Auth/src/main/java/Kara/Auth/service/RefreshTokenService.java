package Kara.Auth.service;

import Kara.Auth.common.exception.AuthException;
import Kara.Auth.entities.RefreshToken;
import Kara.Auth.entities.UserCredentials;
import Kara.Auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    @Value("${jwt.refresh.expiration}")
    private long expiration;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken generateRefreshToken(UserCredentials user){
        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.flush();
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(new Date(System.currentTimeMillis() + expiration));
        refreshToken.setUser(user);
        refreshTokenRepository.save(refreshToken);
        return refreshToken;
    }

    public RefreshToken verifyExpiration(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new AuthException("Refresh token not found", HttpStatus.NOT_FOUND));

        if (refreshToken.getExpiryDate().before(new Date())) {
            refreshTokenRepository.delete(refreshToken);
            throw new AuthException("Refresh token expired", HttpStatus.UNAUTHORIZED);

        }
        return refreshToken;
    }

    @Transactional
    public boolean deleteRefreshToken(String refreshToken) {
        Optional<RefreshToken> token = refreshTokenRepository.findByToken(refreshToken);
        if (token.isPresent()) {
            refreshTokenRepository.delete(token.get());
            refreshTokenRepository.flush();
            return true;
        }
        return false;
    }
}
