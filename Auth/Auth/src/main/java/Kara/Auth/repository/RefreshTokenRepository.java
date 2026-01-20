package Kara.Auth.repository;

import Kara.Auth.entities.RefreshToken;
import Kara.Auth.entities.UserCredentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String refreshToken);

    @Modifying
    void deleteByUser(UserCredentials user);
}
