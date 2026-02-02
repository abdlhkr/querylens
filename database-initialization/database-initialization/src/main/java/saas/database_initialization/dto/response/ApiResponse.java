package saas.database_initialization.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Generic API response wrapper for all endpoints
 * Provides consistent response structure across the application
 * 
 * @param <T> The type of data being returned
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /**
     * Indicates whether the request was successful
     */
    private boolean success;

    /**
     * Human-readable message describing the response
     */
    private String message;

    /**
     * The actual data payload (null for errors)
     */
    private T data;

    /**
     * Timestamp when the response was generated
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * The request path that generated this response
     */
    private String path;

    /**
     * HTTP status code
     */
    private int statusCode;

    // Convenience factory methods

    /**
     * Create a successful response with data
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .statusCode(200)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a successful response with data and custom status code
     */
    public static <T> ApiResponse<T> success(T data, String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .statusCode(statusCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a successful response without data
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .statusCode(200)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create an error response
     */
    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create an error response with data
     */
    public static <T> ApiResponse<T> error(String message, T data, int statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .statusCode(statusCode)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
