package saas.database_initialization.constants;

/**
 * Centralized response messages for consistency across the application
 */
public final class ResponseMessages {

    private ResponseMessages() {
        // Prevent instantiation
    }

    // Success messages
    public static final String SUCCESS = "Operation completed successfully";
    public static final String CREATED = "Resource created successfully";
    public static final String UPDATED = "Resource updated successfully";
    public static final String DELETED = "Resource deleted successfully";
    public static final String RETRIEVED = "Resource retrieved successfully";

    // Device messages
    public static final String DEVICE_REGISTERED = "Device registered successfully";
    public static final String DEVICE_AUTHENTICATED = "Device authenticated successfully";
    public static final String DEVICE_NOT_FOUND = "Device not found";
    public static final String DEVICE_ALREADY_EXISTS = "Device already exists";

    // Validation messages
    public static final String VALIDATION_FAILED = "Validation failed";
    public static final String INVALID_INPUT = "Invalid input provided";
    public static final String REQUIRED_FIELD_MISSING = "Required field is missing";

    // Error messages
    public static final String INTERNAL_ERROR = "An internal error occurred";
    public static final String RESOURCE_NOT_FOUND = "Resource not found";
    public static final String UNAUTHORIZED_ACCESS = "Unauthorized access";
    public static final String FORBIDDEN_ACCESS = "Access forbidden";
    public static final String CONFLICT = "Resource conflict occurred";

    // Database messages
    public static final String DATABASE_ERROR = "Database error occurred";
    public static final String DUPLICATE_ENTRY = "Duplicate entry found";
    public static final String CONSTRAINT_VIOLATION = "Database constraint violation";

    // Pagination messages
    public static final String PAGE_RETRIEVED = "Page retrieved successfully";
    public static final String EMPTY_RESULT = "No results found";
}
