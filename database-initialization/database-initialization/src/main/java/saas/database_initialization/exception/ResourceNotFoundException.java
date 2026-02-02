package saas.database_initialization.exception;

/**
 * Exception thrown when a requested resource is not found
 * Returns HTTP 404 status code
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND", 404);
    }

    public ResourceNotFoundException(String resourceName, String identifier) {
        super(String.format("%s not found with identifier: %s", resourceName, identifier),
                "RESOURCE_NOT_FOUND",
                404);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: %s", resourceName, fieldName, fieldValue),
                "RESOURCE_NOT_FOUND",
                404);
    }
}
