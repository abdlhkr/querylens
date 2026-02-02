package saas.database_initialization.exception;

/**
 * Exception thrown when a resource conflict occurs
 * Typically used for duplicate entries or constraint violations
 * Returns HTTP 409 status code
 */
public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(message, "CONFLICT", 409);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, "CONFLICT", cause);
    }

    public static ConflictException duplicate(String resourceName, String fieldName, Object value) {
        return new ConflictException(
                String.format("%s already exists with %s: %s", resourceName, fieldName, value));
    }

    public static ConflictException alreadyExists(String resourceName) {
        return new ConflictException(
                String.format("%s already exists", resourceName));
    }
}
