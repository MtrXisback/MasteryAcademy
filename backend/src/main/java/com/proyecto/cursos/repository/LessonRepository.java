package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourseModuleIdOrderByOrderIndexAsc(Long moduleId);
}
