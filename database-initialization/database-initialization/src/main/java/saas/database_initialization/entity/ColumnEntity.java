package saas.database_initialization.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Structured, per-column metadata extracted during introspection. Normalized
 * source of truth for a database's schema. Linked to {@link TableEntity} by
 * convention via {@code (databaseId, schemaName, tableName)} — no JPA relationship.
 */
@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "column_metadata")
public class ColumnEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "database_id", nullable = false)
    private UUID databaseId;

    @Column(name = "schema_name", nullable = false)
    private String schemaName;

    @Column(name = "table_name", nullable = false)
    private String tableName;

    @Column(name = "column_name", nullable = false)
    private String columnName;

    @Column(name = "data_type")
    private String dataType;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(name = "is_foreign", nullable = false)
    private boolean foreign;

    /** FK target as {@code schema.table.column}, null when not a foreign key */
    @Column(name = "connected_to")
    private String connectedTo;

    @Column(name = "ordinal_position")
    private Integer ordinalPosition;
}
