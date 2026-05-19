package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.CourseModule;
import com.proyecto.cursos.model.Lesson;
import com.proyecto.cursos.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    @Autowired
    CourseService courseService;

    @PostMapping("/courses/{courseId}/modules")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<CourseModule> addModule(@PathVariable Long courseId, @RequestBody CourseModule module) {
        return ResponseEntity.ok(courseService.addModule(courseId, module));
    }

    @DeleteMapping("/modules/{moduleId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteModule(@PathVariable Long moduleId) {
        courseService.deleteModule(moduleId);
        return ResponseEntity.ok("Módulo eliminado con éxito");
    }

    @PostMapping("/modules/{moduleId}/lessons")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Lesson> addLesson(@PathVariable Long moduleId, @RequestBody Lesson lesson) {
        return ResponseEntity.ok(courseService.addLesson(moduleId, lesson));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @PreAuthorize("hasRole('INSTRUCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteLesson(@PathVariable Long lessonId) {
        courseService.deleteLesson(lessonId);
        return ResponseEntity.ok("Lección eliminada con éxito");
    }
}
