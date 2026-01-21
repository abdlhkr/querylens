package kara.saas.controller;

import jakarta.validation.Valid;
import kara.saas.common.ApiResponse;
import kara.saas.dto.CreateUserRequest;
import kara.saas.dto.UpdateUserRequest;
import kara.saas.dto.UserResponse;
import kara.saas.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for User operations.
 * User ID is obtained from gateway headers (extracted from JWT token).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

        private final UserService userService;

        /**
         * Create/Initialize a new user profile
         * User ID comes from the gateway (extracted from JWT token)
         */
        @PostMapping
        public ResponseEntity<ApiResponse<UserResponse>> createUser(
                        @RequestHeader("X-User-Id") String userId,
                        @Valid @RequestBody CreateUserRequest request) {

                UserResponse user = userService.createUser(UUID.fromString(userId), request);
                return new ResponseEntity<>(
                                ApiResponse.success("User created successfully", user),
                                HttpStatus.CREATED);
        }

        /**
         * Update user profile
         */
        @PutMapping
        public ResponseEntity<ApiResponse<UserResponse>> updateUser(
                        @RequestHeader("X-User-Id") String userId,
                        @Valid @RequestBody UpdateUserRequest request) {

                UserResponse user = userService.updateUser(UUID.fromString(userId), request);
                return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
        }

        /**
         * Delete user profile
         */
        @DeleteMapping
        public ResponseEntity<ApiResponse<Void>> deleteUser(
                        @RequestHeader("X-User-Id") String userId) {

                userService.deleteUser(UUID.fromString(userId));
                return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
        }

        /**
         * Get current user profile
         */
        @GetMapping("/me")
        public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
                        @RequestHeader("X-User-Id") String userId) {

                UserResponse user = userService.getUserById(UUID.fromString(userId));
                return ResponseEntity.ok(ApiResponse.success(user));
        }

        /**
         * Get all users (admin endpoint)
         */
        @GetMapping
        public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
                        @RequestHeader("X-User-Role") String role) {

                // Optional: Add role check here if needed
                List<UserResponse> users = userService.getAllUsers();
                return ResponseEntity.ok(ApiResponse.success(users));
        }

        /**
         * Get user by ID (admin endpoint)
         */
        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<UserResponse>> getUserById(
                        @PathVariable UUID id,
                        @RequestHeader("X-User-Role") String role) {

                // Optional: Add role check here if needed
                UserResponse user = userService.getUserById(id);
                return ResponseEntity.ok(ApiResponse.success(user));
        }
}
