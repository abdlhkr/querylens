package saas.database_initialization.exception;

/**
 * Exception thrown for bad request errors
 * Returns HTTP 400 status code
 */
public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(message, "BAD_REQUEST", 400);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, "BAD_REQUEST", cause);
    }

    public static BadRequestException invalidParameter(String parameterName) {
        return new BadRequestException(
                String.format("Invalid parameter: %s", parameterName));
    }

    public static BadRequestException missingParameter(String parameterName) {
        return new BadRequestException(
                String.format("Missing required parameter: %s", parameterName));
    }
}
