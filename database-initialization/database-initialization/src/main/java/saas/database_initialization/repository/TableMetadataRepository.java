package saas.database_initialization.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import saas.database_initialization.entity.TableEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface TableMetadataRepository extends JpaRepository<TableEntity, UUID> {

    /** Find all table metadata for a specific database */
    List<TableEntity> findByDatabaseId(UUID databaseId);

    /** Whether any table metadata already exists for a database */
    boolean existsByDatabaseId(UUID databaseId);

    /** Delete all table metadata for a database (used for re-initialization) */
    @Transactional
    void deleteByDatabaseId(UUID databaseId);
}
