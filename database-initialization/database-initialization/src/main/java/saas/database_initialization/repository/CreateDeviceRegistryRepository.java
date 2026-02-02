package saas.database_initialization.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import saas.database_initialization.entity.CreateDeviceRegistry;

import java.util.Optional;
import java.util.UUID;

public interface CreateDeviceRegistryRepository  extends JpaRepository<CreateDeviceRegistry, UUID> {
    Optional<CreateDeviceRegistry> findByUserID(String userID);
}
