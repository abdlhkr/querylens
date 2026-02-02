package saas.database_initialization.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import saas.database_initialization.constants.ResponseMessages;
import saas.database_initialization.dto.device.authenticate.AuthenticateDeviceRequest;
import saas.database_initialization.dto.device.authenticate.AuthenticateDeviceResponse;
import saas.database_initialization.dto.device.register.CreateDeviceRequest;
import saas.database_initialization.dto.device.register.CreateDeviceResponse;
import saas.database_initialization.dto.response.ApiResponse;
import saas.database_initialization.service.CreateDeviceCodeService;

/**
 * REST controller for device registration and authentication
 * Provides endpoints for the device registration workflow
 */
@Slf4j
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final CreateDeviceCodeService deviceService;

    /**
     * Register a new device for a user
     * Creates a temporary registration code that expires in 30 minutes
     * 
     * @param request The registration request containing user ID
     * @return Registration response with device registry ID (code)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<CreateDeviceResponse>> registerDevice(
            @Valid @RequestBody CreateDeviceRequest request,
            @RequestHeader("X-User-Id") String userId) {

        request.setUserID(userId);
        log.info("POST /api/devices/register - User: {}", request.getUserID());

        CreateDeviceResponse response = deviceService.registerDevice(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        response,
                        ResponseMessages.DEVICE_REGISTERED,
                        HttpStatus.CREATED.value()));
    }

    /**
     * Authenticate a device using the registration code
     * Validates the code and creates the device if valid
     * 
     * @param request The authentication request with user ID and registry ID
     * @return Authentication response with registered device ID
     */
    @PostMapping("/authenticate")
    public ResponseEntity<ApiResponse<AuthenticateDeviceResponse>> authenticateDevice(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AuthenticateDeviceRequest request) {
        request.setUserID(userId);
        log.info("POST /api/devices/authenticate - User: {}", request.getUserID());

        AuthenticateDeviceResponse response = deviceService.authenticateDevice(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        response,
                        ResponseMessages.DEVICE_AUTHENTICATED));
    }

    /**
     * Check if a user has an active registration code
     * 
     * @param userId The user ID to check
     * @return Boolean indicating if registration code exists
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkRegistration(
            @RequestHeader("X-User-Id") String userId) {

        log.info("GET /api/devices/check/{}", userId);

        boolean hasRegistration = deviceService.isAny(userId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        hasRegistration,
                        hasRegistration ? "User has active registration code" : "No active registration code found"));
    }
}
