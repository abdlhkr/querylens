package saas.database_initialization.enums;

/**
 * Standardized error codes for the application
 * Provides machine-readable error identifiers
 */
public enum ErrorCode {
    // Validation errors (400)
    VALIDATION_ERROR("VALIDATION_ERROR", "Request validation failed"),
    INVALID_PARAMETER("INVALID_PARAMETER", "Invalid parameter provided"),
    MISSING_PARAMETER("MISSING_PARAMETER", "Required parameter is missing"),
    INVALID_FORMAT("INVALID_FORMAT", "Invalid data format"),

    // Authentication errors (401)
    UNAUTHORIZED("UNAUTHORIZED", "Authentication required"),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Invalid credentials"),
    TOKEN_EXPIRED("TOKEN_EXPIRED", "Authentication token has expired"),
    TOKEN_INVALID("TOKEN_INVALID", "Invalid authentication token"),

    // Authorization errors (403)
    FORBIDDEN("FORBIDDEN", "Access denied"),
    INSUFFICIENT_PERMISSIONS("INSUFFICIENT_PERMISSIONS", "Insufficient permissions"),

    // Resource errors (404)
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Requested resource not found"),
    ENDPOINT_NOT_FOUND("ENDPOINT_NOT_FOUND", "Endpoint not found"),

    // Conflict errors (409)
    CONFLICT("CONFLICT", "Resource conflict"),
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", "Resource already exists"),
    CONSTRAINT_VIOLATION("CONSTRAINT_VIOLATION", "Database constraint violation"),

    // Business logic errors (400)
    BUSINESS_ERROR("BUSINESS_ERROR", "Business logic error"),
    INVALID_STATE("INVALID_STATE", "Invalid state for operation"),
    OPERATION_NOT_ALLOWED("OPERATION_NOT_ALLOWED", "Operation not allowed"),

    // Server errors (500)
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "Internal server error"),
    DATABASE_ERROR("DATABASE_ERROR", "Database error occurred"),
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", "External service error"),

    // Bad request errors (400)
    BAD_REQUEST("BAD_REQUEST", "Bad request"),
    INVALID_JSON("INVALID_JSON", "Invalid JSON format"),
    MALFORMED_REQUEST("MALFORMED_REQUEST", "Malformed request");

    private final String code;
    private final String description;

    ErrorCode(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return code;
    }
}
