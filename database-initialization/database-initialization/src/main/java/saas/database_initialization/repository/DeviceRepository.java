package saas.database_initialization.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import saas.database_initialization.entity.Device;
import saas.database_initialization.enums.DeviceStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, UUID> {
    Optional<Device> findByConnectionId(String connectionId);

    List<Device> findByStatus(DeviceStatus status);

    /**
     * Find device by user ID - each user has one device
     */
    Optional<Device> findByUserID(UUID userId);
}
