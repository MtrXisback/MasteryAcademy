package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByLessonIdOrderByCreatedAtDesc(Long lessonId);
}
