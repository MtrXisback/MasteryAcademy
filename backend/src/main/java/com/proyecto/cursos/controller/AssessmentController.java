package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.Certificate;
import com.proyecto.cursos.model.Quiz;
import com.proyecto.cursos.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    @Autowired
    AssessmentService assessmentService;

    @GetMapping({"/quiz/course/{courseId}", "/{courseId}"})
    public ResponseEntity<Quiz> getQuizByCourse(@PathVariable Long courseId) {
        return assessmentService.getQuizByCourse(courseId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{courseId}")
    public ResponseEntity<Quiz> saveQuiz(@PathVariable Long courseId, @RequestBody Quiz quiz) {
        return ResponseEntity.ok(assessmentService.saveQuiz(courseId, quiz));
    }

    @PostMapping("/quiz/{quizId}/submit")
    public ResponseEntity<?> submitQuiz(@PathVariable Long quizId, @RequestBody List<Integer> answers) {
        String username = getAuthenticatedUsername();
        boolean passed = assessmentService.submitQuiz(username, quizId, answers);
        return ResponseEntity.ok(Map.of("passed", passed));
    }

    @GetMapping("/certificates")
    public ResponseEntity<List<Certificate>> getMyCertificates() {
        String username = getAuthenticatedUsername();
        return ResponseEntity.ok(assessmentService.getUserCertificates(username));
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
