package com.proyecto.cursos.controller;

import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.service.CourseService;
import com.proyecto.cursos.payload.response.MessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import com.proyecto.cursos.security.CourseSecurity;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CourseSecurity courseSecurity;

    @GetMapping
    public org.springframework.data.domain.Page<Course> getAllCourses(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long instructorId,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return courseService.searchCourses(title, categoryId, instructorId, level, pageable);
    }

    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Error: Debes estar logueado"));
        }
        String username = auth.getName();
        return ResponseEntity.ok(courseService.createCourse(course, username));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or (hasRole('INSTRUCTOR') and @courseSecurity.isOwner(#id, authentication.name))")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course course) {
        return courseService.updateCourse(id, course);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN') or (hasRole('INSTRUCTOR') and @courseSecurity.isOwner(#id, authentication.name))")
    public void deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
    }

    @PostMapping("/{id}/enroll")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')") // Security Fix: Prevent manual enrollment by students
    public ResponseEntity<?> enrollCourse(@PathVariable Long id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(new MessageResponse("Error: Debes estar logueado"));
        }
        String username = auth.getName();
        courseService.enrollUserInCourse(username, id);
        return ResponseEntity.ok(new MessageResponse("Inscripción manual exitosa (Admin)"));
    }

    @GetMapping("/enrolled")
    public Set<Course> getEnrolledCourses() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return Set.of();
        }
        String username = auth.getName();
        return courseService.getUserEnrolledCourses(username);
    }

    @GetMapping("/{id}/content")
    public ResponseEntity<?> getCourseContent(@PathVariable Long id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(new MessageResponse("Error: Debes estar logueado"));
        }
        
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        // Security Fix: Protect premium content. Only Admin, Enrolled Student or Course Owner can access.
        boolean isOwner = courseSecurity.isOwner(id, username);
        if (!isAdmin && !isOwner && !courseService.isUserEnrolled(username, id)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(new MessageResponse("Error: Acceso denegado. No estás inscrito ni eres el instructor de este curso."));
        }
        
        return ResponseEntity.ok(courseService.getCourseWithContent(id));
    }

    @GetMapping("/stats")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Course> all = courseService.getAllCourses();
        
        long studentCount = all.stream()
                .mapToLong(c -> c.getEnrolledStudents() != null ? c.getEnrolledStudents().size() : 0)
                .sum();
                
        double totalRevenue = all.stream()
                .mapToDouble(c -> {
                    double price = c.getPrice() != null ? c.getPrice() : 0.0;
                    int students = c.getEnrolledStudents() != null ? c.getEnrolledStudents().size() : 0;
                    return price * students;
                })
                .sum();

        List<Map<String, Object>> salesBreakdown = all.stream()
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("courseId", c.getId());
                    map.put("courseTitle", c.getTitle());
                    map.put("price", c.getPrice());
                    int students = c.getEnrolledStudents() != null ? c.getEnrolledStudents().size() : 0;
                    map.put("students", students);
                    double revenue = c.getPrice() != null ? c.getPrice() * students : 0.0;
                    map.put("revenue", revenue);
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("studentCount", studentCount);
        stats.put("courseCount", all.size());
        stats.put("salesBreakdown", salesBreakdown);
        
        return ResponseEntity.ok(stats);
    }
}
