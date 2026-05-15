package Kara.Auth.repository;

import Kara.Auth.entities.ConfType;
import Kara.Auth.entities.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {

    Optional<VerificationCode> findByEmailAndCodeAndTypeAndUsedFalse(
            String email, String code, ConfType type);

    void deleteByEmailAndType(String email, ConfType type);

    void deleteByEmail(String email);
}
