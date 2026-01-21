package kara.saas.exception;

import kara.saas.common.StatusType;
import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception for validation errors with field-level error details.
 * Used for custom validation logic in services.
 */
@Getter
public class ValidationException extends BaseException {

    private final Map<String, String> fieldErrors;

    public ValidationException(String message) {
        super(message, StatusType.VALIDATION_ERROR, "VALIDATION_ERROR");
        this.fieldErrors = new HashMap<>();
    }

    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message, StatusType.VALIDATION_ERROR, "VALIDATION_ERROR");
        this.fieldErrors = fieldErrors != null ? fieldErrors : new HashMap<>();
    }

    public ValidationException(String field, String errorMessage) {
        super(errorMessage, StatusType.VALIDATION_ERROR, "VALIDATION_ERROR");
        this.fieldErrors = new HashMap<>();
        this.fieldErrors.put(field, errorMessage);
    }

    /**
     * Add a field error to the exception
     */
    public ValidationException addFieldError(String field, String message) {
        this.fieldErrors.put(field, message);
        return this;
    }

    /**
     * Check if there are any field errors
     */
    public boolean hasFieldErrors() {
        return !fieldErrors.isEmpty();
    }
}
