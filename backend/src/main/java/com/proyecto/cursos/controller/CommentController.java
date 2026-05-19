package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.Comment;
import com.proyecto.cursos.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/lesson/{lessonId}")
    public List<Comment> getComments(@PathVariable Long lessonId) {
        return commentService.getCommentsByLesson(lessonId);
    }

    @PostMapping("/lesson/{lessonId}")
    public ResponseEntity<Comment> addComment(@PathVariable Long lessonId, @RequestBody String content) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        // El contenido viene como string plano si usamos @RequestBody String, 
        // pero a veces viene con comillas si el frontend envía JSON string. Limpiamos:
        if (content.startsWith("\"") && content.endsWith("\"")) {
            content = content.substring(1, content.length() - 1);
        }
        return ResponseEntity.ok(commentService.addComment(lessonId, username, content));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        commentService.deleteComment(id, username);
        return ResponseEntity.ok().build();
    }
}
