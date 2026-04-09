package saas.database_initialization.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import saas.database_initialization.dto.response.ApiResponse;
import saas.database_initialization.entity.DatabaseIntrospectionQueries;
import saas.database_initialization.enums.DatabaseType;
import saas.database_initialization.service.DatabaseIntrospectionQueriesService;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing database introspection queries.
 * These queries are used to initialize database metadata when a new database is
 * added.
 */
@Slf4j
@RestController
@RequestMapping("/api/devices/introspection-queries")
@RequiredArgsConstructor
public class DatabaseIntrospectionQueriesController {

        private final DatabaseIntrospectionQueriesService introspectionQueriesService;

        /**
         * Get all introspection queries
         */
        @GetMapping
        public ResponseEntity<ApiResponse<List<DatabaseIntrospectionQueries>>> getAll() {
                log.info("GET /api/introspection-queries");

                List<DatabaseIntrospectionQueries> queries = introspectionQueriesService.getAll();

                return ResponseEntity.ok(
                                ApiResponse.success(queries, "Introspection queries retrieved"));
        }

        /**
         * Get introspection queries by database type
         */
        @GetMapping("/by-type/{dbType}")
        public ResponseEntity<ApiResponse<List<DatabaseIntrospectionQueries>>> getByDbType(
                        @PathVariable DatabaseType dbType) {

                log.info("GET /api/introspection-queries/by-type/{}", dbType);

                List<DatabaseIntrospectionQueries> queries = introspectionQueriesService.getByDbType(dbType);

                return ResponseEntity.ok(
                                ApiResponse.success(queries, "Introspection queries retrieved for type: " + dbType));
        }

        /**
         * Get a single introspection query by ID
         */
        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<DatabaseIntrospectionQueries>> getById(@PathVariable UUID id) {
                log.info("GET /api/introspection-queries/{}", id);

                DatabaseIntrospectionQueries query = introspectionQueriesService.getById(id);

                return ResponseEntity.ok(
                                ApiResponse.success(query, "Introspection query retrieved"));
        }

        /**
         * Create a new introspection query
         */
        @PostMapping
        public ResponseEntity<ApiResponse<DatabaseIntrospectionQueries>> create(
                        @RequestParam DatabaseType dbType,
                        @RequestBody String query) {

                log.info("POST /api/introspection-queries - dbType: {}", dbType);

                DatabaseIntrospectionQueries created = introspectionQueriesService.create(dbType, query);

                return ResponseEntity.status(HttpStatus.CREATED).body(
                                ApiResponse.success(created, "Introspection query created",
                                                HttpStatus.CREATED.value()));
        }

        /**
         * Update an existing introspection query
         */
        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<DatabaseIntrospectionQueries>> update(
                        @PathVariable UUID id,
                        @RequestParam(required = false) DatabaseType dbType,
                        @RequestBody(required = false) String query) {

                log.info("PUT /api/introspection-queries/{}", id);

                DatabaseIntrospectionQueries updated = introspectionQueriesService.update(id, dbType, query);

                return ResponseEntity.ok(
                                ApiResponse.success(updated, "Introspection query updated"));
        }

        /**
         * Delete an introspection query by ID
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
                log.info("DELETE /api/introspection-queries/{}", id);

                introspectionQueriesService.delete(id);

                return ResponseEntity.ok(
                                ApiResponse.success(null, "Introspection query deleted"));
        }

        /**
         * Delete all introspection queries for a specific database type
         */
        @DeleteMapping("/by-type/{dbType}")
        public ResponseEntity<ApiResponse<Void>> deleteByDbType(@PathVariable DatabaseType dbType) {
                log.info("DELETE /api/introspection-queries/by-type/{}", dbType);

                introspectionQueriesService.deleteByDbType(dbType);

                return ResponseEntity.ok(
                                ApiResponse.success(null, "All introspection queries deleted for type: " + dbType));
        }
}
