package saas.database_initialization.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Validation error response with field-level error details
 * Used when request validation fails
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationErrorResponse {

    /**
     * Error code for validation errors
     */
    @Builder.Default
    private String errorCode = "VALIDATION_ERROR";

    /**
     * General validation error message
     */
    private String message;

    /**
     * List of field-specific validation errors
     */
    @Builder.Default
    private List<FieldError> fieldErrors = new ArrayList<>();

    /**
     * Timestamp when the validation error occurred
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * The request path that caused the validation error
     */
    private String path;

    /**
     * HTTP status code (typically 400 for validation errors)
     */
    @Builder.Default
    private int statusCode = 400;

    /**
     * Represents a single field validation error
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldError {
        /**
         * The field name that failed validation
         */
        private String field;

        /**
         * The rejected value
         */
        private Object rejectedValue;

        /**
         * The validation error message
         */
        private String message;

        /**
         * The validation constraint that was violated (e.g., "NotNull", "Size")
         */
        private String constraint;
    }

    // Convenience methods

    public void addFieldError(String field, Object rejectedValue, String message, String constraint) {
        if (this.fieldErrors == null) {
            this.fieldErrors = new ArrayList<>();
        }
        this.fieldErrors.add(FieldError.builder()
                .field(field)
                .rejectedValue(rejectedValue)
                .message(message)
                .constraint(constraint)
                .build());
    }

    public void addFieldError(FieldError fieldError) {
        if (this.fieldErrors == null) {
            this.fieldErrors = new ArrayList<>();
        }
        this.fieldErrors.add(fieldError);
    }

    public static ValidationErrorResponse of(String message, String path) {
        return ValidationErrorResponse.builder()
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
