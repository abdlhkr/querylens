package kara.saas.exception;

import kara.saas.common.StatusType;
import lombok.Getter;

/**
 * Base exception class for all custom exceptions.
 * Provides consistent error handling with StatusType support.
 */
@Getter
public abstract class BaseException extends RuntimeException {

    private final StatusType statusType;
    private final String errorCode;

    protected BaseException(String message, StatusType statusType, String errorCode) {
        super(message);
        this.statusType = statusType;
        this.errorCode = errorCode;
    }

    protected BaseException(String message, StatusType statusType, String errorCode, Throwable cause) {
        super(message, cause);
        this.statusType = statusType;
        this.errorCode = errorCode;
    }
}
