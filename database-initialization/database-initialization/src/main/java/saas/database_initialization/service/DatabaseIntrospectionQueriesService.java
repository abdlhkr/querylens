package saas.database_initialization.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import saas.database_initialization.entity.DatabaseIntrospectionQueries;
import saas.database_initialization.enums.DatabaseType;
import saas.database_initialization.exception.BadRequestException;
import saas.database_initialization.exception.ResourceNotFoundException;
import saas.database_initialization.repository.DatabaseIntrospectionQueriesRepository;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseIntrospectionQueriesService {

    private final DatabaseIntrospectionQueriesRepository repository;

    /**
     * Get all introspection queries
     */
    public List<DatabaseIntrospectionQueries> getAll() {
        return repository.findAll();
    }

    /**
     * Get introspection queries by database type
     */
    public List<DatabaseIntrospectionQueries> getByDbType(DatabaseType dbType) {
        return repository.findByDbType(dbType);
    }

    /**
     * Get a single introspection query by ID
     */
    public DatabaseIntrospectionQueries getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Introspection query not found with id: " + id));
    }

    /**
     * Create a new introspection query
     */
    public DatabaseIntrospectionQueries create(DatabaseType dbType, String query) {
        if (query == null || query.isBlank()) {
            throw new BadRequestException("Query cannot be empty");
        }

        DatabaseIntrospectionQueries entity = new DatabaseIntrospectionQueries();
        entity.setDbType(dbType);
        entity.setQuery(query);

        DatabaseIntrospectionQueries saved = repository.save(entity);
        log.info("Created introspection query - id: {}, dbType: {}", saved.getId(), dbType);
        return saved;
    }

    /**
     * Update an existing introspection query
     */
    public DatabaseIntrospectionQueries update(UUID id, DatabaseType dbType, String query) {
        DatabaseIntrospectionQueries entity = getById(id);

        if (dbType != null) {
            entity.setDbType(dbType);
        }
        if (query != null && !query.isBlank()) {
            entity.setQuery(query);
        }

        DatabaseIntrospectionQueries updated = repository.save(entity);
        log.info("Updated introspection query - id: {}", id);
        return updated;
    }

    /**
     * Delete an introspection query by ID
     */
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Introspection query not found with id: " + id);
        }
        repository.deleteById(id);
        log.info("Deleted introspection query - id: {}", id);
    }

    /**
     * Delete all introspection queries for a database type
     */
    @Transactional
    public void deleteByDbType(DatabaseType dbType) {
        repository.deleteByDbType(dbType);
        log.info("Deleted all introspection queries for dbType: {}", dbType);
    }
}
