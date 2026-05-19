package com.proyecto.cursos.service;

import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.model.Review;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.repository.CourseRepository;
import com.proyecto.cursos.repository.ReviewRepository;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Review> getReviewsByCourse(Long courseId) {
        return reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }

    @Transactional
    public Review addReview(Long courseId, String username, Integer rating, String comment) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Curso no encontrado"));

        Review review = Review.builder()
                .rating(rating)
                .comment(comment)
                .user(user)
                .course(course)
                .build();

        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public Double getAverageRating(Long courseId) {
        List<Review> reviews = reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }
}
