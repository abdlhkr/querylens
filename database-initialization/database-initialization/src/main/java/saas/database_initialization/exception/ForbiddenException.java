package saas.database_initialization.exception;

/**
 * Exception thrown when access to a resource is forbidden
 * Returns HTTP 403 status code
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(message, "FORBIDDEN", 403);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, "FORBIDDEN", cause);
    }

    public static ForbiddenException insufficientPermissions() {
        return new ForbiddenException("You do not have permission to access this resource");
    }

    public static ForbiddenException insufficientPermissions(String resource) {
        return new ForbiddenException(
                String.format("You do not have permission to access: %s", resource));
    }
}
