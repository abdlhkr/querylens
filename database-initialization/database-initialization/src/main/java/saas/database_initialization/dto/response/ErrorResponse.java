package saas.database_initialization.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Detailed error response for API errors
 * Provides comprehensive error information for debugging and user feedback
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    /**
     * Machine-readable error code for programmatic handling
     */
    private String errorCode;

    /**
     * Human-readable error message
     */
    private String message;

    /**
     * Additional details about the error (optional)
     */
    private String details;

    /**
     * Timestamp when the error occurred
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * The request path that caused the error
     */
    private String path;

    /**
     * HTTP status code
     */
    private int statusCode;

    /**
     * Stack trace for debugging (only in development mode)
     */
    private String debugInfo;

    // Convenience factory methods

    public static ErrorResponse of(String errorCode, String message, String path, int statusCode) {
        return ErrorResponse.builder()
                .errorCode(errorCode)
                .message(message)
                .path(path)
                .statusCode(statusCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse of(String errorCode, String message, String details, String path, int statusCode) {
        return ErrorResponse.builder()
                .errorCode(errorCode)
                .message(message)
                .details(details)
                .path(path)
                .statusCode(statusCode)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
