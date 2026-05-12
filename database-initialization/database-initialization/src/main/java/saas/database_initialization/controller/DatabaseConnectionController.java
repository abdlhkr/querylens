package saas.database_initialization.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import saas.database_initialization.dto.database.CreateDatabaseConnectionRequest;
import saas.database_initialization.dto.database.DatabaseConnectionResponse;
import saas.database_initialization.dto.database.UpdateDatabaseConnectionRequest;
import saas.database_initialization.dto.response.ApiResponse;
import saas.database_initialization.entity.DatabaseConnection;
import saas.database_initialization.service.DatabaseConnectionService;
import saas.database_initialization.service.DatabaseWebSocketService;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for database connection management.
 * Allows users to register their database connections (without passwords).
 * Passwords are stored only in the agent.
 */
@Slf4j
@RestController
@RequestMapping("/api/devices/databases")
@RequiredArgsConstructor
public class DatabaseConnectionController {

        private final DatabaseConnectionService databaseService;
        private final DatabaseWebSocketService webSocketService;

        /**
         * Create a new database connection
         * Password is NOT included - it will be entered in the agent
         * Device ID is found automatically from user ID (each user has one device)
         */
        @PostMapping
        public ResponseEntity<ApiResponse<DatabaseConnectionResponse>> createConnection(
                        @Valid @RequestBody CreateDatabaseConnectionRequest request,
                        @RequestHeader("X-User-Id") String userId) {

                log.info("POST /api/devices/databases - User: {}", userId);

                request.setUserId(userId);

                // Extract password before saving — it is never persisted
                String password = request.getPassword();

                // Create database connection record (without password)
                DatabaseConnectionResponse response = databaseService.createConnection(request);

                // Forward password to agent via WebSocket — not stored in our DB
                DatabaseConnection connection = databaseService.getConnectionEntity(response.getId());
                webSocketService.notifyNewDatabase(connection, password);

                return ResponseEntity.status(HttpStatus.CREATED).body(
                                ApiResponse.success(
                                                response,
                                                "Database connection created. Please verify from your agent.",
                                                HttpStatus.CREATED.value()));
        }

        /**
         * Get all database connections for the current user
         */
        @GetMapping
        public ResponseEntity<ApiResponse<List<DatabaseConnectionResponse>>> getUserConnections(
                        @RequestHeader("X-User-Id") String userId) {

                log.info("GET /api/databases - User: {}", userId);

                List<DatabaseConnectionResponse> connections = databaseService.getUserConnections(userId);

                return ResponseEntity.ok(
                                ApiResponse.success(connections, "Database connections retrieved"));
        }

        /**
         * Get a specific database connection
         */
        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<DatabaseConnectionResponse>> getConnection(
                        @PathVariable UUID id,
                        @RequestHeader("X-User-Id") String userId) {

                log.info("GET /api/databases/{} - User: {}", id, userId);

                DatabaseConnectionResponse response = databaseService.getConnection(userId, id);

                return ResponseEntity.ok(
                                ApiResponse.success(response, "Database connection retrieved"));
        }

        /**
         * Update a database connection
         * If connection details change, status will be reset to PENDING
         */
        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<DatabaseConnectionResponse>> updateConnection(
                        @PathVariable UUID id,
                        @Valid @RequestBody UpdateDatabaseConnectionRequest request,
                        @RequestHeader("X-User-Id") String userId) {

                log.info("PUT /api/databases/{} - User: {}", id, userId);

                DatabaseConnectionResponse response = databaseService.updateConnection(userId, id, request);

                return ResponseEntity.ok(
                                ApiResponse.success(response, "Database connection updated"));
        }

        /**
         * Delete a database connection
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Void>> deleteConnection(
                        @PathVariable UUID id,
                        @RequestHeader("X-User-Id") String userId) {

                log.info("DELETE /api/databases/{} - User: {}", id, userId);

                databaseService.deleteConnection(userId, id);

                return ResponseEntity.ok(
                                ApiResponse.success(null, "Database connection deleted"));
        }
}
