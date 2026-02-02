# Response System Usage Guide

This guide explains how to use the best practice response system in your Spring Boot application.

## Table of Contents
- [Overview](#overview)
- [Response DTOs](#response-dtos)
- [Using ApiResponse](#using-apiresponse)
- [Exception Handling](#exception-handling)
- [Validation](#validation)
- [Pagination](#pagination)
- [Best Practices](#best-practices)

## Overview

The response system provides:
- **Consistent API responses** across all endpoints
- **Comprehensive error handling** with detailed error information
- **Validation support** with field-level error details
- **Pagination** for list endpoints
- **Centralized exception handling** via `@RestControllerAdvice`

## Response DTOs

### ApiResponse<T>

Generic wrapper for all API responses.

**Structure:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2026-01-28T10:20:30",
  "path": "/api/devices",
  "statusCode": 200
}
```

### ErrorResponse

Detailed error information.

**Structure:**
```json
{
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Device not found",
  "details": "Additional error details",
  "timestamp": "2026-01-28T10:20:30",
  "path": "/api/devices/123",
  "statusCode": 404
}
```

### ValidationErrorResponse

Validation errors with field-level details.

**Structure:**
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "fieldErrors": [
    {
      "field": "email",
      "rejectedValue": "invalid-email",
      "message": "must be a well-formed email address",
      "constraint": "Email"
    }
  ],
  "timestamp": "2026-01-28T10:20:30",
  "path": "/api/users",
  "statusCode": 400
}
```

## Using ApiResponse

### In Controllers

#### Success Response with Data
```java
@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeviceDTO>> getDevice(@PathVariable String id) {
        DeviceDTO device = deviceService.findById(id);
        
        ApiResponse<DeviceDTO> response = ApiResponse.success(
            device, 
            ResponseMessages.RETRIEVED
        );
        
        return ResponseEntity.ok(response);
    }
}
```

#### Success Response without Data
```java
@DeleteMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable String id) {
    deviceService.delete(id);
    
    ApiResponse<Void> response = ApiResponse.success(
        ResponseMessages.DELETED
    );
    
    return ResponseEntity.ok(response);
}
```

#### Created Response (201)
```java
@PostMapping
public ResponseEntity<ApiResponse<DeviceDTO>> createDevice(
        @Valid @RequestBody CreateDeviceRequest request) {
    
    DeviceDTO device = deviceService.create(request);
    
    ApiResponse<DeviceDTO> response = ApiResponse.success(
        device,
        ResponseMessages.DEVICE_REGISTERED,
        201
    );
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

## Exception Handling

### Throwing Custom Exceptions

The `GlobalExceptionHandler` automatically catches and handles all exceptions.

#### Resource Not Found (404)
```java
public DeviceDTO findById(String id) {
    return deviceRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Device", "id", id));
}
```

#### Validation Error (400)
```java
public void validateDeviceCode(String code) {
    if (code == null || code.length() < 6) {
        throw new ValidationException("code", "Device code must be at least 6 characters");
    }
}
```

#### Unauthorized (401)
```java
public void authenticate(String token) {
    if (!jwtService.isValid(token)) {
        throw UnauthorizedException.tokenInvalid();
    }
}
```

#### Forbidden (403)
```java
public void checkPermission(User user, String resource) {
    if (!user.hasPermission(resource)) {
        throw ForbiddenException.insufficientPermissions(resource);
    }
}
```

#### Conflict (409)
```java
public void registerDevice(String deviceId) {
    if (deviceRepository.existsById(deviceId)) {
        throw ConflictException.duplicate("Device", "id", deviceId);
    }
}
```

#### Bad Request (400)
```java
public void processRequest(String param) {
    if (param == null) {
        throw BadRequestException.missingParameter("param");
    }
}
```

### Custom Business Exception
```java
public void performBusinessLogic() {
    throw new BusinessException(
        "Custom business error message",
        "CUSTOM_ERROR_CODE",
        400
    );
}
```

## Validation

### Using Bean Validation

Add validation annotations to your DTOs:

```java
import jakarta.validation.constraints.*;

public class CreateDeviceRequest {
    
    @NotBlank(message = "Device name is required")
    @Size(min = 3, max = 50, message = "Device name must be between 3 and 50 characters")
    private String name;
    
    @NotNull(message = "Device type is required")
    private DeviceType type;
    
    @Email(message = "Invalid email format")
    private String contactEmail;
    
    @Pattern(regexp = "^[A-Z0-9]{6,}$", message = "Invalid device code format")
    private String deviceCode;
    
    @Min(value = 0, message = "Value must be positive")
    @Max(value = 100, message = "Value must not exceed 100")
    private Integer batteryLevel;
}
```

### In Controllers

Use `@Valid` annotation to trigger validation:

```java
@PostMapping
public ResponseEntity<ApiResponse<DeviceDTO>> createDevice(
        @Valid @RequestBody CreateDeviceRequest request) {
    // If validation fails, GlobalExceptionHandler automatically returns ValidationErrorResponse
    DeviceDTO device = deviceService.create(request);
    return ResponseEntity.ok(ApiResponse.success(device, ResponseMessages.CREATED));
}
```

### Common Validation Annotations

- `@NotNull` - Field cannot be null
- `@NotBlank` - String cannot be null or empty (trims whitespace)
- `@NotEmpty` - Collection/array cannot be null or empty
- `@Size(min, max)` - String/collection size constraints
- `@Min(value)` - Numeric minimum value
- `@Max(value)` - Numeric maximum value
- `@Email` - Valid email format
- `@Pattern(regexp)` - Matches regex pattern
- `@Past` - Date must be in the past
- `@Future` - Date must be in the future

## Pagination

### Using PagedResponse

```java
@GetMapping
public ResponseEntity<ApiResponse<PagedResponse<DeviceDTO>>> getDevices(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    
    Pageable pageable = PageRequest.of(page, size);
    Page<Device> devicePage = deviceRepository.findAll(pageable);
    
    // Convert entities to DTOs
    Page<DeviceDTO> dtoPage = devicePage.map(this::toDTO);
    
    // Create paged response
    PagedResponse<DeviceDTO> pagedResponse = PagedResponse.of(dtoPage);
    
    ApiResponse<PagedResponse<DeviceDTO>> response = ApiResponse.success(
        pagedResponse,
        ResponseMessages.PAGE_RETRIEVED
    );
    
    return ResponseEntity.ok(response);
}
```

### Manual Pagination

```java
List<DeviceDTO> devices = deviceService.findAll();
PagedResponse<DeviceDTO> pagedResponse = PagedResponse.of(
    devices.subList(0, 10),  // content
    0,                        // page number
    10,                       // page size
    devices.size()            // total elements
);
```

## Best Practices

### 1. Always Use ApiResponse Wrapper
```java
// ✅ Good
public ResponseEntity<ApiResponse<DeviceDTO>> getDevice(String id) {
    DeviceDTO device = deviceService.findById(id);
    return ResponseEntity.ok(ApiResponse.success(device, "Device retrieved"));
}

// ❌ Bad
public ResponseEntity<DeviceDTO> getDevice(String id) {
    return ResponseEntity.ok(deviceService.findById(id));
}
```

### 2. Use Appropriate HTTP Status Codes
```java
// 200 OK - Successful GET, PUT, PATCH
ApiResponse.success(data, message, 200)

// 201 Created - Successful POST
ApiResponse.success(data, message, 201)

// 204 No Content - Successful DELETE (no body)
return ResponseEntity.noContent().build();

// 400 Bad Request - Validation errors
throw new ValidationException("Invalid input");

// 404 Not Found - Resource not found
throw new ResourceNotFoundException("Device", "id", id);

// 409 Conflict - Duplicate resource
throw new ConflictException.duplicate("Device", "id", id);
```

### 3. Use Constants for Messages
```java
// ✅ Good
ApiResponse.success(device, ResponseMessages.DEVICE_REGISTERED);

// ❌ Bad
ApiResponse.success(device, "Device registered successfully");
```

### 4. Throw Specific Exceptions
```java
// ✅ Good
throw new ResourceNotFoundException("Device", "id", deviceId);

// ❌ Bad
throw new RuntimeException("Device not found");
```

### 5. Add Validation to DTOs
```java
// ✅ Good
public class CreateDeviceRequest {
    @NotBlank(message = "Name is required")
    private String name;
}

// ❌ Bad - Manual validation in service
public void create(CreateDeviceRequest request) {
    if (request.getName() == null) {
        throw new ValidationException("Name is required");
    }
}
```

### 6. Use Factory Methods
```java
// ✅ Good - Using factory methods
throw UnauthorizedException.tokenExpired();
throw ConflictException.duplicate("Device", "id", id);

// ✅ Also good - Direct instantiation when needed
throw new ResourceNotFoundException("Custom message");
```

### 7. Log Exceptions Appropriately
The `GlobalExceptionHandler` already logs all exceptions. Don't duplicate logging:

```java
// ✅ Good
throw new ResourceNotFoundException("Device", "id", id);

// ❌ Bad - Duplicate logging
log.error("Device not found: {}", id);
throw new ResourceNotFoundException("Device", "id", id);
```

### 8. Return Proper Response Types
```java
// ✅ Good - Specific type
public ResponseEntity<ApiResponse<DeviceDTO>> getDevice(String id)

// ❌ Bad - Generic type
public ResponseEntity<?> getDevice(String id)
```

## Example: Complete CRUD Controller

```java
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {
    
    private final DeviceService deviceService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<DeviceDTO>>> getAllDevices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PagedResponse<DeviceDTO> devices = deviceService.findAll(page, size);
        return ResponseEntity.ok(
            ApiResponse.success(devices, ResponseMessages.PAGE_RETRIEVED)
        );
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeviceDTO>> getDevice(@PathVariable String id) {
        DeviceDTO device = deviceService.findById(id);
        return ResponseEntity.ok(
            ApiResponse.success(device, ResponseMessages.RETRIEVED)
        );
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<DeviceDTO>> createDevice(
            @Valid @RequestBody CreateDeviceRequest request) {
        
        DeviceDTO device = deviceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.success(device, ResponseMessages.DEVICE_REGISTERED, 201)
        );
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeviceDTO>> updateDevice(
            @PathVariable String id,
            @Valid @RequestBody UpdateDeviceRequest request) {
        
        DeviceDTO device = deviceService.update(id, request);
        return ResponseEntity.ok(
            ApiResponse.success(device, ResponseMessages.UPDATED)
        );
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable String id) {
        deviceService.delete(id);
        return ResponseEntity.ok(
            ApiResponse.success(ResponseMessages.DELETED)
        );
    }
}
```

## Error Response Examples

### Validation Error
**Request:**
```json
POST /api/devices
{
  "name": "",
  "type": null
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errorCode": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fieldErrors": [
      {
        "field": "name",
        "rejectedValue": "",
        "message": "Device name is required",
        "constraint": "NotBlank"
      },
      {
        "field": "type",
        "rejectedValue": null,
        "message": "Device type is required",
        "constraint": "NotNull"
      }
    ],
    "timestamp": "2026-01-28T10:20:30",
    "path": "/api/devices",
    "statusCode": 400
  },
  "statusCode": 400,
  "path": "/api/devices",
  "timestamp": "2026-01-28T10:20:30"
}
```

### Resource Not Found
**Request:**
```
GET /api/devices/non-existent-id
```

**Response (404):**
```json
{
  "success": false,
  "message": "Device not found with id: non-existent-id",
  "data": {
    "errorCode": "RESOURCE_NOT_FOUND",
    "message": "Device not found with id: non-existent-id",
    "timestamp": "2026-01-28T10:20:30",
    "path": "/api/devices/non-existent-id",
    "statusCode": 404
  },
  "statusCode": 404,
  "path": "/api/devices/non-existent-id",
  "timestamp": "2026-01-28T10:20:30"
}
```

---

## Summary

This response system provides:
- ✅ Consistent API responses
- ✅ Comprehensive error handling
- ✅ Automatic validation
- ✅ Pagination support
- ✅ Centralized exception management
- ✅ Type-safe responses
- ✅ Developer-friendly error messages

Use this system consistently across all endpoints for a professional, maintainable API.
