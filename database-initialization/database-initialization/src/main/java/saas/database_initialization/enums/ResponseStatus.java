package saas.database_initialization.enums;

/**
 * Standard response status codes
 */
public enum ResponseStatus {
    SUCCESS("Success"),
    ERROR("Error"),
    WARNING("Warning"),
    INFO("Information");

    private final String description;

    ResponseStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
