package saas.database_initialization.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import saas.database_initialization.entity.DatabaseIntrospectionQueries;
import saas.database_initialization.enums.DatabaseType;

import java.util.List;
import java.util.UUID;

@Repository
public interface DatabaseIntrospectionQueriesRepository extends JpaRepository<DatabaseIntrospectionQueries, UUID> {

    /**
     * Find all introspection queries for a specific database type
     */
    List<DatabaseIntrospectionQueries> findByDbType(DatabaseType dbType);

    /**
     * Check if introspection queries exist for a given database type
     */
    boolean existsByDbType(DatabaseType dbType);

    /**
     * Delete all introspection queries for a specific database type
     */
    void deleteByDbType(DatabaseType dbType);
}
