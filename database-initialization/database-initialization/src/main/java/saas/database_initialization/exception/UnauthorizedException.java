package saas.database_initialization.exception;

/**
 * Exception thrown for authentication and authorization errors
 * Returns HTTP 401 status code
 */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED", 401);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, "UNAUTHORIZED", cause);
    }

    public static UnauthorizedException invalidCredentials() {
        return new UnauthorizedException("Invalid credentials provided");
    }

    public static UnauthorizedException tokenExpired() {
        return new UnauthorizedException("Authentication token has expired");
    }

    public static UnauthorizedException tokenInvalid() {
        return new UnauthorizedException("Invalid authentication token");
    }
}
