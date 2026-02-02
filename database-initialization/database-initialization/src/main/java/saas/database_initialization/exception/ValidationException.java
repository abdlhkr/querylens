package saas.database_initialization.exception;

/**
 * Exception thrown for validation errors
 * Returns HTTP 400 status code
 */
public class ValidationException extends BusinessException {

    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", 400);
    }

    public ValidationException(String message, Throwable cause) {
        super(message, "VALIDATION_ERROR", cause);
    }

    public ValidationException(String fieldName, String message) {
        super(String.format("Validation failed for field '%s': %s", fieldName, message),
                "VALIDATION_ERROR",
                400);
    }
}
