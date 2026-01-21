package kara.saas.service;

import kara.saas.dto.CreateUserRequest;
import kara.saas.dto.UpdateUserRequest;
import kara.saas.dto.UserResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for User operations.
 */
public interface UserService {

    /**
     * Create a new user with the given ID (from gateway/token)
     */
    UserResponse createUser(UUID userId, CreateUserRequest request);

    /**
     * Update an existing user
     */
    UserResponse updateUser(UUID userId, UpdateUserRequest request);

    /**
     * Delete a user by ID
     */
    void deleteUser(UUID userId);

    /**
     * Get a user by ID
     */
    UserResponse getUserById(UUID userId);

    /**
     * Get all users
     */
    List<UserResponse> getAllUsers();
}
