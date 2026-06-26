package saas.database_initialization.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import saas.database_initialization.entity.ColumnEntity;
import saas.database_initialization.entity.TableEntity;
import saas.database_initialization.repository.ColumnMetadataRepository;
import saas.database_initialization.repository.TableMetadataRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds the textual {@code db_scheme} that fast-service expects from the
 * structured {@link TableEntity}/{@link ColumnEntity} metadata.
 *
 * <p>Bridge until Weaviate hybrid search lands: today it renders every table.
 * Later the {@code build} entry point will be fed the top-N tables selected by
 * semantic search instead of the full set.
 *
 * <p>Example output:
 * <pre>
 * Schema: public
 * Table: users (rows: 20000)
 *   - id integer PK
 *   - org_id integer FK -&gt; public.orgs.id
 *   - name varchar
 * </pre>
 */
@Component
@RequiredArgsConstructor
public class SchemaTextBuilder {

    private final TableMetadataRepository tableMetadataRepository;
    private final ColumnMetadataRepository columnMetadataRepository;

    /** Build the full schema text for a database from all stored metadata. */
    public String build(UUID databaseId) {
        List<TableEntity> tables = tableMetadataRepository.findByDatabaseId(databaseId);
        List<ColumnEntity> columns = columnMetadataRepository.findByDatabaseId(databaseId);
        return build(tables, columns);
    }

    /** Render the given tables and columns into the db_scheme text. */
    public String build(List<TableEntity> tables, List<ColumnEntity> columns) {
        if (tables == null || tables.isEmpty()) {
            return "";
        }

        Map<String, List<ColumnEntity>> columnsByTable = columns.stream()
                .collect(Collectors.groupingBy(c -> key(c.getSchemaName(), c.getTableName())));

        // Highest-importance tables first so the most valuable schema leads.
        List<TableEntity> ordered = tables.stream()
                .sorted(Comparator.comparing(
                        (TableEntity t) -> t.getImportance() == null ? 0.0 : t.getImportance())
                        .reversed())
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        String currentSchema = null;

        for (TableEntity table : ordered) {
            if (!table.getSchemaName().equals(currentSchema)) {
                currentSchema = table.getSchemaName();
                sb.append("Schema: ").append(currentSchema).append("\n");
            }

            appendTableHeader(sb, table);
            appendColumns(sb, columnsByTable
                    .getOrDefault(key(table.getSchemaName(), table.getTableName()), List.of()));
        }

        return sb.toString().stripTrailing();
    }

    /**
     * Render a single table as a self-contained block (with its own {@code Schema:}
     * line). Used as the {@code schema_text} stored per table in Weaviate so each
     * retrieved table carries its full schema context.
     */
    public String buildTableBlock(TableEntity table, List<ColumnEntity> cols) {
        StringBuilder sb = new StringBuilder();
        sb.append("Schema: ").append(table.getSchemaName()).append("\n");
        appendTableHeader(sb, table);
        appendColumns(sb, cols == null ? List.of() : cols);
        return sb.toString().stripTrailing();
    }

    private void appendTableHeader(StringBuilder sb, TableEntity table) {
        sb.append("Table: ").append(table.getTableName());
        if (table.getRowCount() != null) {
            sb.append(" (rows: ").append(table.getRowCount()).append(")");
        }
        sb.append("\n");
    }

    private void appendColumns(StringBuilder sb, List<ColumnEntity> cols) {
        cols.stream()
                .sorted(Comparator.comparing(
                        c -> c.getOrdinalPosition() == null ? Integer.MAX_VALUE : c.getOrdinalPosition()))
                .forEach(c -> {
                    sb.append("  - ").append(c.getColumnName());
                    if (c.getDataType() != null) {
                        sb.append(" ").append(c.getDataType());
                    }
                    if (c.isPrimary()) {
                        sb.append(" PK");
                    }
                    if (c.isForeign() && c.getConnectedTo() != null) {
                        sb.append(" FK -> ").append(c.getConnectedTo());
                    }
                    sb.append("\n");
                });
    }

    private String key(String schema, String table) {
        return schema + "." + table;
    }
}
