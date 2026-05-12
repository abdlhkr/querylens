package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import saas.database_initialization.dto.device.authenticate.AuthenticateDeviceRequest;
import saas.database_initialization.dto.device.authenticate.AuthenticateDeviceResponse;
import saas.database_initialization.dto.device.register.CreateDeviceRequest;
import saas.database_initialization.dto.device.register.CreateDeviceResponse;
import saas.database_initialization.entity.CreateDeviceRegistry;
import saas.database_initialization.entity.Device;
import saas.database_initialization.enums.DeviceStatus;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.exception.ConflictException;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.CreateDeviceRegistryRepository;
import saas.database_initialization.repository.DeviceRepository;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreateDeviceCodeService {
    private final CreateDeviceRegistryRepository registryRepository;
    private final DeviceRepository deviceRepository;
    private final long tokenLifetime = 1000 * 60 * 60;

    public boolean isAny(String userId) {
        return registryRepository.findByUserID(userId).isPresent();
    }

    public CreateDeviceResponse registerDevice(CreateDeviceRequest request) {
        log.info("Registering device for user: {}", request.getUserID());

        Optional<CreateDeviceRegistry> optional = registryRepository.findByUserID(request.getUserID());

        if (optional.isPresent()) {
            CreateDeviceRegistry existing = optional.get();

            if (existing.getExpirationTime().before(new Date())) {
                registryRepository.delete(existing);
                log.warn("Expired registration code deleted for user: {}", request.getUserID());
                throw new BadRequestException("Registration time expired, please request a new code");
            }

            log.warn("User already has active registration code: {}", request.getUserID());
            throw new ConflictException("User already has an active device registration code");
        }

        CreateDeviceRegistry registry = new CreateDeviceRegistry();
        registry.setUserID(request.getUserID());
        registry.setExpirationTime();
        CreateDeviceRegistry dbResponse = registryRepository.save(registry);
        log.info("Device registration code created: {} for user: {}", dbResponse.getDeviceID(), request.getUserID());

        return new CreateDeviceResponse(dbResponse.getDeviceID().toString());
    }

    public AuthenticateDeviceResponse authenticateDevice(AuthenticateDeviceRequest request) {
        log.info("Authenticating device for user: {}", request.getUserID());

        Optional<CreateDeviceRegistry> registry = registryRepository.findByUserID(request.getUserID());

        if (registry.isEmpty()) {
            log.warn("No registration code found for user: {}", request.getUserID());
            throw new ResourceNotFoundException("Device registration code not found. Please register first.");
        }

        CreateDeviceRegistry existing = registry.get();

        // Check if code is expired
        if (existing.getExpirationTime().before(new Date())) {
            registryRepository.delete(existing);
            log.warn("Expired registration code for user: {} old code will be deleted you can get a new one ", request.getUserID());
            throw new BadRequestException("Registration code has expired. Please request a new code.");
        }

        // Validate the registration code matches
        if (!existing.getDeviceID().toString().equals(request.getDeviceRegistryID())) {
            log.warn("Invalid registration code provided for user: {}", request.getUserID());
            throw new BadRequestException("Invalid device registration code");
        }

        // Create the actual device
        Device device = new Device();
        device.setUserID(UUID.fromString(request.getUserID()));
        Device savedDevice = deviceRepository.save(device);

        // Delete the registration code after successful authentication
        registryRepository.delete(existing);
        log.info("Device authenticated successfully: {} for user: {}", savedDevice.getRegisteredDeviceID(),
                request.getUserID());

        AuthenticateDeviceResponse response = new AuthenticateDeviceResponse();
        response.setRegisteredDeviceID(savedDevice.getRegisteredDeviceID());

        return response;
    }

    /**
     * Authenticate device using deviceId for reconnection
     * Used when device already exists and wants to reconnect
     */
    public Device authenticateWithDeviceId(UUID deviceId, String connectionId) {
        log.info("Reconnecting device: {}", deviceId);

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Device", "id", deviceId));

        // Update device status and connection info
        device.setStatus(DeviceStatus.ACTIVE);
        device.setConnectionId(connectionId);
        device.setConnectedAt(LocalDateTime.now());
        device.setLastSeenAt(LocalDateTime.now());

        Device updated = deviceRepository.save(device);
        log.info("Device reconnected successfully: {}", deviceId);

        return updated;
    }

    /**
     * Update device status
     */
    public void updateDeviceStatus(UUID deviceId, DeviceStatus status) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Device", "id", deviceId));

        device.setStatus(status);
        device.setLastSeenAt(LocalDateTime.now());
        deviceRepository.save(device);

        log.info("Device {} status updated to {}", deviceId, status);
    }

    /**
     * Handle device disconnection
     */
    public void handleDisconnect(String connectionId) {
        Optional<Device> deviceOpt = deviceRepository.findByConnectionId(connectionId);

        if (deviceOpt.isPresent()) {
            Device device = deviceOpt.get();
            device.setStatus(DeviceStatus.INACTIVE);
            device.setConnectionId(null);
            device.setLastSeenAt(LocalDateTime.now());
            deviceRepository.save(device);

            log.info("Device {} disconnected", device.getRegisteredDeviceID());
        }
    }

    /**
     * Get device repository for WebSocket handler
     */
    public DeviceRepository getDeviceRepository() {
        return deviceRepository;
    }
}
