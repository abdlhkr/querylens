package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import saas.database_initialization.client.FastServiceClient;
import saas.database_initialization.dto.websocket.QueryResultMessage;
import saas.database_initialization.entity.ColumnEntity;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.entity.TableEntity;
import saas.database_initialization.enums.DatabaseType;
import saas.database_initialization.event.DatabaseVerifiedEvent;
import saas.database_initialization.repository.ColumnMetadataRepository;
import saas.database_initialization.repository.TableMetadataRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Extracts structured schema metadata ({@link TableEntity} + {@link ColumnEntity})
 * from a user's database when it is verified.
 *
 * <p>For each schema it runs two fixed, dbType-specific queries (see
 * {@link SchemaMetadataQueries}): one returning per-column metadata (with PK/FK
 * info) and one returning approximate per-table row counts. Rows are parsed into
 * column entities and grouped into table entities. Runs asynchronously to avoid
 * blocking the WebSocket handler.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseIntrospectionService {

    private final DatabaseConnectionService databaseConnectionService;
    private final TableMetadataRepository tableMetadataRepository;
    private final ColumnMetadataRepository columnMetadataRepository;
    private final DatabaseWebSocketService webSocketService;
    private final SchemaMetadataQueries metadataQueries;
    private final SchemaTextBuilder schemaTextBuilder;
    private final FastServiceClient fastServiceClient;

    private static final int QUERY_TIMEOUT_SECONDS = 30;
    // ANALYZE on a large DB can take a while; give it more room than a normal query.
    private static final int ANALYZE_TIMEOUT_SECONDS = 120;

    /**
     * Extract metadata for a verified database. Triggered by
     * {@link DatabaseVerifiedEvent}, runs asynchronously.
     *
     * <p>Skips databases that already have metadata: on agent reconnect every
     * connection is re-verified (which re-fires this event), but the schema only
     * needs to be introspected once. Use {@link #runIntrospection(UUID)} directly
     * to force a re-introspection.
     */
    @Async
    @EventListener
    public void onDatabaseVerified(DatabaseVerifiedEvent event) {
        UUID databaseId = event.getDatabaseId();
        if (tableMetadataRepository.existsByDatabaseId(databaseId)) {
            log.info("Metadata already exists for database {}, skipping introspection on re-verify", databaseId);
            return;
        }
        runIntrospection(databaseId);
    }

    /** Extract and persist structured metadata for a given database. */
    public void runIntrospection(UUID databaseId) {
        log.info("Starting introspection for database: {}", databaseId);

        try {
            DatabaseConnection connection = databaseConnectionService.getConnectionEntity(databaseId);
            DatabaseType dbType = connection.getDbType();

            if (!metadataQueries.isSupported(dbType)) {
                log.warn("Structured introspection not supported for dbType: {}. Skipping.", dbType);
                return;
            }

            // Clear previous metadata for this database (in case of re-init)
            tableMetadataRepository.deleteByDatabaseId(databaseId);
            columnMetadataRepository.deleteByDatabaseId(databaseId);

            List<String> schemas = fetchSchemas(databaseId, connection);
            log.info("Found {} schemas for database {}: {}", schemas.size(), databaseId, schemas);

            // Make row-count stats accurate before reading them (PostgreSQL only, and
            // only when they look stale). See refreshStaleStatsIfNeeded.
            refreshStaleStatsIfNeeded(databaseId, dbType);

            for (String schemaName : schemas) {
                extractSchema(databaseId, dbType, schemaName);
            }

            log.info("Introspection completed for database: {}", databaseId);

            // Push the freshly stored metadata to fast-service for Weaviate indexing.
            indexInWeaviate(databaseId, dbType);

        } catch (Exception e) {
            log.error("Introspection failed for database: {}", databaseId, e);
        }
    }

    /**
     * Build per-table index payloads from the stored metadata and push them to
     * fast-service. Each table contributes a {@code content} document (name +
     * columns + FK, used for embedding/search) and a {@code schema_text} block
     * (column types + PK/FK, given verbatim to the LLM at query time).
     */
    private void indexInWeaviate(UUID databaseId, DatabaseType dbType) {
        try {
            List<TableEntity> tables = tableMetadataRepository.findByDatabaseId(databaseId);
            if (tables.isEmpty()) {
                log.info("No tables to index for database {}", databaseId);
                return;
            }

            Map<String, List<ColumnEntity>> columnsByTable = columnMetadataRepository
                    .findByDatabaseId(databaseId).stream()
                    .collect(Collectors.groupingBy(c -> c.getSchemaName() + "." + c.getTableName()));

            List<Map<String, Object>> payload = new ArrayList<>();
            for (TableEntity table : tables) {
                List<ColumnEntity> cols = columnsByTable.getOrDefault(
                        table.getSchemaName() + "." + table.getTableName(), Collections.emptyList());

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("schema_name", table.getSchemaName());
                row.put("table_name", table.getTableName());
                row.put("importance", table.getImportance() == null ? 0.0 : table.getImportance());
                row.put("row_count", table.getRowCount() == null ? 0L : table.getRowCount());
                row.put("column_count", table.getColumnCount() == null ? 0 : table.getColumnCount());
                row.put("content", buildContent(table));
                row.put("schema_text", schemaTextBuilder.buildTableBlock(table, cols));
                payload.add(row);
            }

            fastServiceClient.indexTables(databaseId, dbType.name(), payload);

        } catch (Exception e) {
            log.error("Failed to index metadata in Weaviate for database {}: {}",
                    databaseId, e.getMessage());
        }
    }

    /** Build the embedding document for a table: name + column names + FK edges. */
    private String buildContent(TableEntity table) {
        StringBuilder sb = new StringBuilder();
        sb.append(table.getSchemaName()).append(".").append(table.getTableName()).append("\n");
        if (table.getColumns() != null && !table.getColumns().isBlank()) {
            sb.append("columns: ").append(table.getColumns()).append("\n");
        }
        if (table.getForeignRelations() != null && !table.getForeignRelations().isBlank()) {
            sb.append("foreign: ").append(table.getForeignRelations());
        }
        return sb.toString().stripTrailing();
    }

    /** Extract table + column metadata for a single schema. */
    private void extractSchema(UUID databaseId, DatabaseType dbType, String schemaName) {
        try {
            List<Map<String, Object>> columnRows = runQuery(databaseId,
                    metadataQueries.columnQuery(dbType, schemaName, true));

            // The empty-table filter relies on approximate row stats (n_live_tup etc.)
            // which are 0 for a freshly loaded DB whose stats haven't been gathered —
            // that would wrongly drop every table. If nothing came back, retry without
            // the filter so we still capture the schema.
            if (columnRows.isEmpty()) {
                log.warn("No non-empty tables for database {}, schema {} (row stats may be stale); "
                        + "retrying without the empty-table filter", databaseId, schemaName);
                columnRows = runQuery(databaseId, metadataQueries.columnQuery(dbType, schemaName, false));
            }

            if (columnRows.isEmpty()) {
                log.info("No columns found for database {}, schema {}", databaseId, schemaName);
                return;
            }

            Map<String, Long> rowCounts = fetchRowCounts(databaseId, dbType, schemaName);

            // Build column entities and group them by table (preserve query order).
            List<ColumnEntity> columns = new ArrayList<>();
            Map<String, List<ColumnEntity>> byTable = new LinkedHashMap<>();

            for (Map<String, Object> row : columnRows) {
                String tableName = str(row, "table_name");
                if (tableName == null) {
                    continue;
                }

                ColumnEntity column = new ColumnEntity();
                column.setDatabaseId(databaseId);
                column.setSchemaName(schemaName);
                column.setTableName(tableName);
                column.setColumnName(str(row, "column_name"));
                column.setDataType(str(row, "data_type"));
                column.setPrimary(bool(row, "is_primary"));
                column.setForeign(bool(row, "is_foreign"));
                column.setConnectedTo(str(row, "connected_to"));
                column.setOrdinalPosition(integer(row, "ordinal_position"));

                columns.add(column);
                byTable.computeIfAbsent(tableName, k -> new ArrayList<>()).add(column);
            }

            List<TableEntity> tables = byTable.entrySet().stream()
                    .map(e -> buildTable(databaseId, schemaName, e.getKey(), e.getValue(),
                            rowCounts.getOrDefault(e.getKey(), 0L)))
                    .collect(Collectors.toList());

            columnMetadataRepository.saveAll(columns);
            tableMetadataRepository.saveAll(tables);

            log.info("Saved metadata for database {}, schema {}: {} tables, {} columns",
                    databaseId, schemaName, tables.size(), columns.size());

        } catch (Exception e) {
            log.error("Failed to extract metadata for database {}, schema {}", databaseId, schemaName, e);
        }
    }

    /** Aggregate a table's columns into a {@link TableEntity}. */
    private TableEntity buildTable(UUID databaseId, String schemaName, String tableName,
                                   List<ColumnEntity> cols, long rowCount) {
        TableEntity table = new TableEntity();
        table.setDatabaseId(databaseId);
        table.setSchemaName(schemaName);
        table.setTableName(tableName);
        table.setTableDescription(null); // filled later by the LLM
        table.setRowCount(rowCount);
        table.setColumnCount(cols.size());
        table.setImportance(Math.log10(rowCount + 1.0));

        table.setColumns(cols.stream()
                .map(ColumnEntity::getColumnName)
                .collect(Collectors.joining(", ")));

        String foreignRelations = cols.stream()
                .filter(ColumnEntity::isForeign)
                .filter(c -> c.getConnectedTo() != null)
                .map(c -> tableName + "." + c.getColumnName() + " -> " + c.getConnectedTo())
                .collect(Collectors.joining("; "));
        table.setForeignRelations(foreignRelations.isBlank() ? null : foreignRelations);

        return table;
    }

    /** Run the row-count query and return a {@code tableName -> rowCount} map. */
    private Map<String, Long> fetchRowCounts(UUID databaseId, DatabaseType dbType, String schemaName) {
        Map<String, Long> counts = new java.util.HashMap<>();
        try {
            List<Map<String, Object>> rows = runQuery(databaseId, metadataQueries.rowCountQuery(dbType, schemaName));
            for (Map<String, Object> row : rows) {
                String tableName = str(row, "table_name");
                if (tableName != null) {
                    counts.put(tableName, longValue(row, "row_count"));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch row counts for database {}, schema {} (continuing with 0): {}",
                    databaseId, schemaName, e.getMessage());
        }
        return counts;
    }

    /** Fetch the list of schemas to introspect. */
    private List<String> fetchSchemas(UUID databaseId, DatabaseConnection connection) throws Exception {
        DatabaseType dbType = connection.getDbType();

        // MySQL: the database name is the schema.
        if (dbType == DatabaseType.MYSQL) {
            return Collections.singletonList(connection.getDatabaseName());
        }

        String query = metadataQueries.schemasQuery(dbType, connection.getDatabaseName());
        if (query == null) {
            return Collections.singletonList("public");
        }

        List<Map<String, Object>> rows = runQuery(databaseId, query);
        List<String> schemas = rows.stream()
                .map(row -> str(row, "schema_name"))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(ArrayList::new));

        if (schemas.isEmpty()) {
            schemas.add(dbType == DatabaseType.MSSQL ? "dbo" : "public");
        }
        return schemas;
    }

    /**
     * If the dbType derives row counts from statistics and those stats look stale
     * (tables exist but all report 0 live rows — typical right after a restore/bulk
     * load before autovacuum runs), run ANALYZE once so the empty-table filter and
     * importance get real numbers. Best-effort: any failure is logged and
     * introspection continues (the per-schema unfiltered fallback still captures the
     * schema). No-op for dbTypes we don't auto-analyze (MySQL/MSSQL).
     */
    private void refreshStaleStatsIfNeeded(UUID databaseId, DatabaseType dbType) {
        String analyzeSql = metadataQueries.analyzeStatement(dbType);
        String probeSql = metadataQueries.staleStatsProbe(dbType);
        if (analyzeSql == null || probeSql == null) {
            return;
        }
        try {
            List<Map<String, Object>> rows = runQuery(databaseId, probeSql);
            if (rows.isEmpty()) {
                return;
            }
            long total = longValue(rows.get(0), "total");
            long nonempty = longValue(rows.get(0), "nonempty");

            if (total > 0 && nonempty == 0) {
                log.info("Row stats look stale for database {} ({} tables, all reporting 0 rows); running ANALYZE",
                        databaseId, total);
                runQuery(databaseId, analyzeSql, ANALYZE_TIMEOUT_SECONDS);
                log.info("ANALYZE completed for database {}", databaseId);
            } else {
                log.debug("Row stats look fresh for database {} ({}/{} tables non-empty); skipping ANALYZE",
                        databaseId, nonempty, total);
            }
        } catch (Exception e) {
            log.warn("Stats refresh skipped for database {} (continuing): {}", databaseId, e.getMessage());
        }
    }

    /** Execute a query via the agent WebSocket and return its rows (never null). */
    private List<Map<String, Object>> runQuery(UUID databaseId, String query) throws Exception {
        return runQuery(databaseId, query, QUERY_TIMEOUT_SECONDS);
    }

    /** Execute a query via the agent WebSocket with a custom timeout (never null). */
    private List<Map<String, Object>> runQuery(UUID databaseId, String query, int timeoutSeconds) throws Exception {
        CompletableFuture<QueryResultMessage> future = webSocketService.executeQuery(databaseId, query);
        QueryResultMessage result = future.get(timeoutSeconds, TimeUnit.SECONDS);
        return result.getData() != null ? result.getData() : Collections.emptyList();
    }

    // --- result-parsing helpers (drivers vary in how they type values) ---

    private Object raw(Map<String, Object> row, String key) {
        if (row.containsKey(key)) {
            return row.get(key);
        }
        // case-insensitive fallback
        for (Map.Entry<String, Object> e : row.entrySet()) {
            if (e.getKey().equalsIgnoreCase(key)) {
                return e.getValue();
            }
        }
        return null;
    }

    private String str(Map<String, Object> row, String key) {
        Object v = raw(row, key);
        return v == null ? null : v.toString();
    }

    private Integer integer(Map<String, Object> row, String key) {
        Object v = raw(row, key);
        if (v == null) {
            return null;
        }
        if (v instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(v.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private long longValue(Map<String, Object> row, String key) {
        Object v = raw(row, key);
        if (v == null) {
            return 0L;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        try {
            return (long) Double.parseDouble(v.toString().trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private boolean bool(Map<String, Object> row, String key) {
        Object v = raw(row, key);
        if (v == null) {
            return false;
        }
        if (v instanceof Boolean b) {
            return b;
        }
        if (v instanceof Number n) {
            return n.intValue() != 0;
        }
        String s = v.toString().trim().toLowerCase();
        return s.equals("true") || s.equals("t") || s.equals("1") || s.equals("yes");
    }
}
