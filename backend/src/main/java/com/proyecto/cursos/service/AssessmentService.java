package com.proyecto.cursos.service;

import com.proyecto.cursos.model.*;
import com.proyecto.cursos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssessmentService {

    private final QuizRepository quizRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final UserProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final GamificationService gamificationService;

    @Transactional(readOnly = true)
    public java.util.Optional<Quiz> getQuizByCourse(Long courseId) {
        return quizRepository.findByCourseId(courseId);
    }

    @Transactional
    public Quiz saveQuiz(Long courseId, Quiz quizDetails) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        Quiz quiz = quizRepository.findByCourseId(courseId)
                .orElseGet(() -> {
                    Quiz newQuiz = new Quiz();
                    newQuiz.setCourse(course);
                    return newQuiz;
                });

        quiz.setTitle(quizDetails.getTitle());
        quiz.setDescription(quizDetails.getDescription());
        quiz.setPassingScore(quizDetails.getPassingScore());

        // Limpiar preguntas anteriores para evitar duplicados si se están reemplazando
        if (quiz.getQuestions() != null) {
            quiz.getQuestions().clear();
        } else {
            quiz.setQuestions(new java.util.ArrayList<>());
        }

        if (quizDetails.getQuestions() != null) {
            for (Question q : quizDetails.getQuestions()) {
                q.setQuiz(quiz);
                quiz.getQuestions().add(q);
            }
        }

        return quizRepository.save(quiz);
    }

    @Transactional
    public boolean submitQuiz(String username, Long quizId, List<Integer> answers) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz no encontrado"));

        List<Question> questions = quiz.getQuestions();
        int correctCount = 0;

        for (int i = 0; i < questions.size(); i++) {
            if (i < answers.size() && questions.get(i).getCorrectAnswerIndex().equals(answers.get(i))) {
                correctCount++;
            }
        }

        double score = (double) correctCount / questions.size() * 100;
        boolean passed = score >= quiz.getPassingScore();

        if (passed) {
            checkAndIssueCertificate(user, quiz.getCourse());
            gamificationService.addXp(username, gamificationService.getXpForQuiz());
        }

        return passed;
    }

    private void checkAndIssueCertificate(User user, Course course) {
        // Verificar si ya tiene el certificado
        if (certificateRepository.findByUserIdAndCourseId(user.getId(), course.getId()).isPresent()) {
            return;
        }

        // Verificar progreso 100%
        long totalLessons = course.getModules().stream()
                .mapToLong(m -> m.getLessons().size())
                .sum();
        
        long completedLessons = progressRepository.findByUserIdAndCourseId(user.getId(), course.getId()).size();

        if (completedLessons >= totalLessons) {
            Certificate cert = Certificate.builder()
                    .user(user)
                    .course(course)
                    .build();
            certificateRepository.save(cert);
        }
    }

    @Transactional(readOnly = true)
    public List<Certificate> getUserCertificates(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return certificateRepository.findByUserId(user.getId());
    }
}
