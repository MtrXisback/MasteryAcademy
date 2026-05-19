package com.proyecto.cursos.controller;

import com.proyecto.cursos.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    CourseService courseService;

    @PostMapping("/lessons/{lessonId}/complete")
    public ResponseEntity<?> completeLesson(@PathVariable Long lessonId) {
        String username = getAuthenticatedUsername();
        courseService.markLessonAsCompleted(username, lessonId);
        return ResponseEntity.ok(Map.of("message", "Lección marcada como completada"));
    }

    @GetMapping("/courses/{courseId}")
    public ResponseEntity<List<Long>> getCourseProgress(@PathVariable Long courseId) {
        String username = getAuthenticatedUsername();
        return ResponseEntity.ok(courseService.getCompletedLessonIds(username, courseId));
    }

    private String getAuthenticatedUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else {
            return principal.toString();
        }
    }
}
