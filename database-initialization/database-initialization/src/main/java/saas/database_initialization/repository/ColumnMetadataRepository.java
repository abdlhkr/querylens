package saas.database_initialization.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import saas.database_initialization.entity.ColumnEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface ColumnMetadataRepository extends JpaRepository<ColumnEntity, UUID> {

    /** Find all column metadata for a specific database */
    List<ColumnEntity> findByDatabaseId(UUID databaseId);

    /** Find all column metadata for a specific table */
    List<ColumnEntity> findByDatabaseIdAndSchemaNameAndTableName(
            UUID databaseId, String schemaName, String tableName);

    /** Delete all column metadata for a database (used for re-initialization) */
    @Transactional
    void deleteByDatabaseId(UUID databaseId);
}
