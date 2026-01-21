package kara.saas.common;

/**
 * Enum representing the status of API responses.
 * Used to provide consistent status codes across all endpoints.
 */
public enum StatusType {
    SUCCESS("Operation completed successfully"),
    ERROR("An error occurred"),
    VALIDATION_ERROR("Validation failed"),
    NOT_FOUND("Resource not found"),
    UNAUTHORIZED("Unauthorized access"),
    FORBIDDEN("Access denied"),
    CONFLICT("Resource conflict");

    private final String description;

    StatusType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
