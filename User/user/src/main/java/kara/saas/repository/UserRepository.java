package kara.saas.repository;

import kara.saas.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository interface for User entity.
 * Uses UUID as the primary key type.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    // JpaRepository provides all standard CRUD operations:
    // save, findById, findAll, deleteById, existsById, etc.
}
