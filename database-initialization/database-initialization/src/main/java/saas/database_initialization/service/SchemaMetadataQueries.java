package saas.database_initialization.service;

import org.springframework.stereotype.Component;
import saas.database_initialization.enums.DatabaseType;

/**
 * Holds the fixed, per-dbType SQL used to extract structured schema metadata.
 *
 * <p>Each query returns a well-known set of column aliases that the
 * {@link DatabaseIntrospectionService} parser relies on:
 * <ul>
 *   <li><b>column</b>: schema_name, table_name, column_name, data_type,
 *       ordinal_position, is_primary, is_foreign, connected_to</li>
 *   <li><b>rowCount</b>: table_name, row_count</li>
 *   <li><b>schemas</b>: schema_name</li>
 * </ul>
 *
 * PostgreSQL, MySQL and MSSQL are supported. SQLITE and anything else returns
 * {@code null} (caller skips structured extraction for that dbType).
 */
@Component
public class SchemaMetadataQueries {

    public boolean isSupported(DatabaseType dbType) {
        return dbType == DatabaseType.POSTGRESQL
                || dbType == DatabaseType.MYSQL
                || dbType == DatabaseType.MSSQL;
    }

    /**
     * Command that refreshes table statistics so row-count signals are accurate.
     *
     * <p>Only PostgreSQL is auto-analyzed: its {@code n_live_tup} is an
     * ANALYZE/autovacuum estimate that reports 0 on a freshly loaded/restored DB
     * until stats are gathered, which makes full tables look empty. MySQL's
     * {@code table_rows} and MSSQL's {@code sys.partitions.rows} don't need this
     * step here. Returns {@code null} for dbTypes we don't auto-analyze.
     */
    public String analyzeStatement(DatabaseType dbType) {
        return dbType == DatabaseType.POSTGRESQL ? "ANALYZE;" : null;
    }

    /**
     * Probe returning a single row {@code (nonempty, total)} so the caller can
     * decide whether stats are stale: {@code total > 0 && nonempty == 0} means
     * tables exist but all report 0 live rows. PostgreSQL only; {@code null} otherwise.
     */
    public String staleStatsProbe(DatabaseType dbType) {
        if (dbType == DatabaseType.POSTGRESQL) {
            return "SELECT "
                    + "(SELECT count(*) FROM pg_stat_user_tables WHERE n_live_tup > 0) AS nonempty, "
                    + "(SELECT count(*) FROM pg_stat_user_tables) AS total";
        }
        return null;
    }

    /** Query that lists the user schemas to introspect. */
    public String schemasQuery(DatabaseType dbType, String databaseName) {
        switch (dbType) {
            case POSTGRESQL:
                return "SELECT nspname AS schema_name "
                        + "FROM pg_catalog.pg_namespace "
                        + "WHERE nspname NOT LIKE 'pg_%' "
                        + "  AND nspname <> 'information_schema'";
            case MSSQL:
                return "SELECT name AS schema_name FROM sys.schemas "
                        + "WHERE name NOT IN ('sys','INFORMATION_SCHEMA','guest',"
                        + "'db_owner','db_accessadmin','db_securityadmin','db_ddladmin',"
                        + "'db_backupoperator','db_datareader','db_datawriter',"
                        + "'db_denydatareader','db_denydatawriter')";
            case MYSQL:
                // In MySQL the database name acts as the schema; handled by caller.
            default:
                return null;
        }
    }

    /** Per-column metadata query for a single schema (excludes empty tables). */
    public String columnQuery(DatabaseType dbType, String schema) {
        return columnQuery(dbType, schema, true);
    }

    /**
     * Per-column metadata query for a single schema.
     *
     * @param excludeEmpty when true, tables with no rows are filtered out (keeps the
     *        WebSocket payload small). The row-count signal is approximate
     *        ({@code n_live_tup}/{@code table_rows}/{@code sys.partitions}) and can
     *        report 0 for a freshly loaded DB whose stats haven't been gathered yet —
     *        which would wrongly drop every table. Callers should retry with
     *        {@code excludeEmpty=false} if the filtered query returns nothing.
     */
    public String columnQuery(DatabaseType dbType, String schema, boolean excludeEmpty) {
        String s = escape(schema);
        switch (dbType) {
            case POSTGRESQL:
                // pg_stat_user_tables already restricts to base tables (excludes views);
                // the n_live_tup>0 part is the (approximate) emptiness filter.
                String pgEmpty = excludeEmpty ? " AND st.n_live_tup > 0" : "";
                return "SELECT c.table_schema AS schema_name, "
                        + "c.table_name AS table_name, "
                        + "c.column_name AS column_name, "
                        + "c.data_type AS data_type, "
                        + "c.ordinal_position AS ordinal_position, "
                        + "(pk.column_name IS NOT NULL) AS is_primary, "
                        + "(fk.column_name IS NOT NULL) AS is_foreign, "
                        + "CASE WHEN fk.column_name IS NOT NULL "
                        + "THEN fk.foreign_table_schema || '.' || fk.foreign_table_name || '.' || fk.foreign_column_name "
                        + "END AS connected_to "
                        + "FROM information_schema.columns c "
                        + "JOIN pg_stat_user_tables st "
                        + "  ON st.schemaname = c.table_schema AND st.relname = c.table_name" + pgEmpty + " "
                        + "LEFT JOIN ("
                        + "  SELECT tc.table_schema, tc.table_name, kcu.column_name "
                        + "  FROM information_schema.table_constraints tc "
                        + "  JOIN information_schema.key_column_usage kcu "
                        + "    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema "
                        + "  WHERE tc.constraint_type = 'PRIMARY KEY'"
                        + ") pk ON pk.table_schema = c.table_schema AND pk.table_name = c.table_name AND pk.column_name = c.column_name "
                        + "LEFT JOIN ("
                        + "  SELECT tc.table_schema, tc.table_name, kcu.column_name, "
                        + "         ccu.table_schema AS foreign_table_schema, "
                        + "         ccu.table_name AS foreign_table_name, "
                        + "         ccu.column_name AS foreign_column_name "
                        + "  FROM information_schema.table_constraints tc "
                        + "  JOIN information_schema.key_column_usage kcu "
                        + "    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema "
                        + "  JOIN information_schema.constraint_column_usage ccu "
                        + "    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema "
                        + "  WHERE tc.constraint_type = 'FOREIGN KEY'"
                        + ") fk ON fk.table_schema = c.table_schema AND fk.table_name = c.table_name AND fk.column_name = c.column_name "
                        + "WHERE c.table_schema = '" + s + "' "
                        + "ORDER BY c.table_name, c.ordinal_position";
            case MYSQL:
                return "SELECT c.table_schema AS schema_name, "
                        + "c.table_name AS table_name, "
                        + "c.column_name AS column_name, "
                        + "c.data_type AS data_type, "
                        + "c.ordinal_position AS ordinal_position, "
                        + "(c.column_key = 'PRI') AS is_primary, "
                        + "(k.referenced_table_name IS NOT NULL) AS is_foreign, "
                        + "CASE WHEN k.referenced_table_name IS NOT NULL "
                        + "THEN CONCAT(k.referenced_table_schema, '.', k.referenced_table_name, '.', k.referenced_column_name) "
                        + "END AS connected_to "
                        + "FROM information_schema.columns c "
                        // restrict to base tables (skips views); table_rows>0 is the emptiness filter
                        + "JOIN information_schema.tables t "
                        + "  ON t.table_schema = c.table_schema AND t.table_name = c.table_name "
                        + " AND t.table_type = 'BASE TABLE'" + (excludeEmpty ? " AND t.table_rows > 0" : "") + " "
                        + "LEFT JOIN information_schema.key_column_usage k "
                        + "  ON k.table_schema = c.table_schema "
                        + " AND k.table_name = c.table_name "
                        + " AND k.column_name = c.column_name "
                        + " AND k.referenced_table_name IS NOT NULL "
                        + "WHERE c.table_schema = '" + s + "' "
                        + "ORDER BY c.table_name, c.ordinal_position";
            case MSSQL:
                return "SELECT s.name AS schema_name, "
                        + "t.name AS table_name, "
                        + "col.name AS column_name, "
                        + "ty.name AS data_type, "
                        + "col.column_id AS ordinal_position, "
                        + "CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS is_primary, "
                        + "CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS is_foreign, "
                        + "CASE WHEN fk.parent_column_id IS NOT NULL "
                        + "THEN rs.name + '.' + rt.name + '.' + rc.name END AS connected_to "
                        + "FROM sys.columns col "
                        + "JOIN sys.tables t ON t.object_id = col.object_id "
                        + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                        + "JOIN sys.types ty ON ty.user_type_id = col.user_type_id "
                        // sys.tables already excludes views; this subquery filters empty tables
                        + (excludeEmpty
                                ? "JOIN ("
                                  + "  SELECT p.object_id FROM sys.partitions p "
                                  + "  WHERE p.index_id IN (0, 1) GROUP BY p.object_id HAVING SUM(p.rows) > 0"
                                  + ") ne ON ne.object_id = col.object_id "
                                : "")
                        + "LEFT JOIN ("
                        + "  SELECT ic.object_id, ic.column_id "
                        + "  FROM sys.indexes i "
                        + "  JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id "
                        + "  WHERE i.is_primary_key = 1"
                        + ") pk ON pk.object_id = col.object_id AND pk.column_id = col.column_id "
                        + "LEFT JOIN sys.foreign_key_columns fk "
                        + "  ON fk.parent_object_id = col.object_id AND fk.parent_column_id = col.column_id "
                        + "LEFT JOIN sys.columns rc ON rc.object_id = fk.referenced_object_id AND rc.column_id = fk.referenced_column_id "
                        + "LEFT JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id "
                        + "LEFT JOIN sys.schemas rs ON rs.schema_id = rt.schema_id "
                        + "WHERE s.name = '" + s + "' "
                        + "ORDER BY t.name, col.column_id";
            default:
                return null;
        }
    }

    /** Per-table approximate row-count query for a single schema. */
    public String rowCountQuery(DatabaseType dbType, String schema) {
        String s = escape(schema);
        switch (dbType) {
            case POSTGRESQL:
                return "SELECT relname AS table_name, n_live_tup AS row_count "
                        + "FROM pg_stat_user_tables WHERE schemaname = '" + s + "' AND n_live_tup > 0";
            case MYSQL:
                return "SELECT table_name AS table_name, table_rows AS row_count "
                        + "FROM information_schema.tables "
                        + "WHERE table_schema = '" + s + "' AND table_type = 'BASE TABLE' AND table_rows > 0";
            case MSSQL:
                return "SELECT t.name AS table_name, SUM(p.rows) AS row_count "
                        + "FROM sys.tables t "
                        + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                        + "JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1) "
                        + "WHERE s.name = '" + s + "' "
                        + "GROUP BY t.name HAVING SUM(p.rows) > 0";
            default:
                return null;
        }
    }

    private String escape(String identifier) {
        return identifier == null ? "" : identifier.replace("'", "''");
    }
}
