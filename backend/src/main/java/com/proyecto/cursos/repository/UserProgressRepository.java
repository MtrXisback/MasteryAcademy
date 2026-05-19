package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    Optional<UserProgress> findByUserIdAndLessonId(Long userId, Long lessonId);
    
    @Query("SELECT up FROM UserProgress up JOIN up.lesson l JOIN l.courseModule m WHERE up.user.id = :userId AND m.course.id = :courseId")
    List<UserProgress> findByUserIdAndCourseId(Long userId, Long courseId);
}
