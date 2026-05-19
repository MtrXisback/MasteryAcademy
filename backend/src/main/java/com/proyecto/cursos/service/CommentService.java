package com.proyecto.cursos.service;

import com.proyecto.cursos.model.Comment;
import com.proyecto.cursos.model.Lesson;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.repository.CommentRepository;
import com.proyecto.cursos.repository.LessonRepository;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Comment> getCommentsByLesson(Long lessonId) {
        return commentRepository.findByLessonIdOrderByCreatedAtDesc(lessonId);
    }

    @Transactional
    public Comment addComment(Long lessonId, String username, String content) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lección no encontrada"));

        Comment comment = Comment.builder()
                .content(content)
                .user(user)
                .lesson(lesson)
                .build();

        return commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));
        
        if (!comment.getUser().getUsername().equals(username)) {
            throw new RuntimeException("No tienes permiso para eliminar este comentario");
        }
        
        commentRepository.delete(comment);
    }
}
