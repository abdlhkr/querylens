package saas.database_initialization.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import saas.database_initialization.dto.response.ApiResponse;
import saas.database_initialization.dto.response.ErrorResponse;
import saas.database_initialization.dto.response.ValidationErrorResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;

/**
 * Global exception handler for all REST controllers
 * Provides centralized exception handling and consistent error responses
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle custom business exceptions
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {

        log.error("Business exception: {}", ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode(ex.getErrorCode())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .statusCode(ex.getStatusCode())
                .timestamp(LocalDateTime.now())
                .build();

        ApiResponse<ErrorResponse> response = ApiResponse.<ErrorResponse>builder()
                .success(false)
                .message(ex.getMessage())
                .data(errorResponse)
                .statusCode(ex.getStatusCode())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    /**
     * Handle validation exceptions (from @Valid annotation)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<ValidationErrorResponse>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        log.error("Validation exception: {}", ex.getMessage());

        ValidationErrorResponse validationError = ValidationErrorResponse.builder()
                .message("Validation failed")
                .path(request.getRequestURI())
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .fieldErrors(new ArrayList<>())
                .build();

        // Extract field errors
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            validationError.addFieldError(
                    fieldError.getField(),
                    fieldError.getRejectedValue(),
                    fieldError.getDefaultMessage(),
                    fieldError.getCode());
        }

        ApiResponse<ValidationErrorResponse> response = ApiResponse.<ValidationErrorResponse>builder()
                .success(false)
                .message("Validation failed")
                .data(validationError)
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle method argument type mismatch
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        log.error("Type mismatch exception: {}", ex.getMessage());

        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(),
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("INVALID_PARAMETER_TYPE")
                .message(message)
                .path(request.getRequestURI())
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();

        ApiResponse<ErrorResponse> response = ApiResponse.<ErrorResponse>builder()
                .success(false)
                .message(message)
                .data(errorResponse)
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle database constraint violations
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {

        log.error("Data integrity violation: {}", ex.getMessage(), ex);

        String message = "Database constraint violation. The operation could not be completed.";

        // Try to provide more specific message
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("unique constraint") ||
                    ex.getMessage().contains("duplicate key")) {
                message = "A record with this information already exists.";
            } else if (ex.getMessage().contains("foreign key constraint")) {
                message = "Cannot complete operation due to related records.";
            } else if (ex.getMessage().contains("not-null constraint")) {
                message = "Required field is missing.";
            }
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("DATABASE_CONSTRAINT_VIOLATION")
                .message(message)
                .path(request.getRequestURI())
                .statusCode(HttpStatus.CONFLICT.value())
                .timestamp(LocalDateTime.now())
                .build();

        ApiResponse<ErrorResponse> response = ApiResponse.<ErrorResponse>builder()
                .success(false)
                .message(message)
                .data(errorResponse)
                .statusCode(HttpStatus.CONFLICT.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle all other uncaught exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unexpected exception: {}", ex.getMessage(), ex);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred. Please try again later.")
                .details(ex.getMessage())
                .path(request.getRequestURI())
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .timestamp(LocalDateTime.now())
                .build();

        ApiResponse<ErrorResponse> response = ApiResponse.<ErrorResponse>builder()
                .success(false)
                .message("An unexpected error occurred")
                .data(errorResponse)
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.error("Illegal argument exception: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("INVALID_ARGUMENT")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();

        ApiResponse<ErrorResponse> response = ApiResponse.<ErrorResponse>builder()
                .success(false)
                .message(ex.getMessage())
                .data(errorResponse)
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
