package Kara.Auth.repository;

import Kara.Auth.entities.UserCredentials;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserCredentialRepository extends JpaRepository<UserCredentials, UUID> {
    Optional<UserCredentials> findByEmail(String email);
}
