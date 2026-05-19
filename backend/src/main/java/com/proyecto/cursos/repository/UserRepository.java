package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.User;
import com.proyecto.cursos.model.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "roles")
    Optional<User> findByUsername(String username);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "roles")
    Optional<User> findByEmail(String email);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "enrolledCourses")
    Optional<User> findWithCoursesByUsername(String username);

    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :role AND u.featured = true AND u.avatarUrl IS NOT NULL")
    List<User> findFeaturedInstructors(@Param("role") ERole role);
}
