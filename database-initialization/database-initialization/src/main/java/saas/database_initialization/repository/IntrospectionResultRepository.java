package saas.database_initialization.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import saas.database_initialization.entity.IntrospectionResult;

import java.util.List;
import java.util.UUID;

@Repository
public interface IntrospectionResultRepository extends JpaRepository<IntrospectionResult, UUID> {

    /**
     * Find all introspection results for a specific database
     */
    List<IntrospectionResult> findByDatabaseId(UUID databaseId);

    /**
     * Delete all introspection results for a database (used for re-initialization)
     */
    @Transactional
    void deleteByDatabaseId(UUID databaseId);
}
