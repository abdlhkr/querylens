package Kara.Auth.repository;

import Kara.Auth.entities.RefreshToken;
import Kara.Auth.entities.UserCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    public Optional<RefreshToken> findByToken(String refreshToken);
    boolean deleteByUser(UserCredentials user);
}
