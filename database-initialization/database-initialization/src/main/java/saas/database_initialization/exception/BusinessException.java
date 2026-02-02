package saas.database_initialization.exception;

import lombok.Getter;

/**
 * Base exception for all business logic errors
 * Extends RuntimeException to avoid checked exception handling
 */
@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final int statusCode;

    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
        this.statusCode = 400;
    }

    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = 400;
    }

    public BusinessException(String message, String errorCode, int statusCode) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "BUSINESS_ERROR";
        this.statusCode = 400;
    }

    public BusinessException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.statusCode = 400;
    }
}
