package saas.database_initialization.enums;

/**
 * Supported database types for user connections
 */
public enum DatabaseType {
    POSTGRESQL, // Driver: pg
    MYSQL, // Driver: mysql2
    MSSQL, // Driver: mssql
    SQLITE // Driver: sql.js
}
