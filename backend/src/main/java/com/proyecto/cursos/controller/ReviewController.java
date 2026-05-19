package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.Review;
import com.proyecto.cursos.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/course/{courseId}")
    public List<Review> getReviews(@PathVariable Long courseId) {
        return reviewService.getReviewsByCourse(courseId);
    }

    @GetMapping("/course/{courseId}/average")
    public ResponseEntity<Double> getAverage(@PathVariable Long courseId) {
        return ResponseEntity.ok(reviewService.getAverageRating(courseId));
    }

    @PostMapping("/course/{courseId}")
    public ResponseEntity<Review> addReview(@PathVariable Long courseId, @RequestBody Map<String, Object> body) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Integer rating = (Integer) body.get("rating");
        String comment = (String) body.get("comment");
        return ResponseEntity.ok(reviewService.addReview(courseId, username, rating, comment));
    }
}
