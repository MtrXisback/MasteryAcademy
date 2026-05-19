package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.model.ECourseLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    @Query("SELECT c FROM Course c WHERE " +
           "(:title IS NULL OR LOWER(c.title) LIKE :title) AND " +
           "(:categoryId IS NULL OR c.category.id = :categoryId) AND " +
           "(:instructorId IS NULL OR c.instructor.id = :instructorId) AND " +
           "(:level IS NULL OR c.level = :level)")
    Page<Course> searchCourses(@Param("title") String title, 
                               @Param("categoryId") Long categoryId,
                               @Param("instructorId") Long instructorId,
                               @Param("level") ECourseLevel level,
                               Pageable pageable);

    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.modules m LEFT JOIN FETCH m.lessons WHERE c.id = :id")
    Optional<Course> findByIdWithContent(@Param("id") Long id);

    boolean existsByIdAndInstructor_Username(Long id, String username);
}
