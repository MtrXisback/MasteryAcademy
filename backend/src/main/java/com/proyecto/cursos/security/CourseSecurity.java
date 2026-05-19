package com.proyecto.cursos.security;

import com.proyecto.cursos.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("courseSecurity")
@RequiredArgsConstructor
public class CourseSecurity {
    
    private final CourseRepository courseRepository;

    public boolean isOwner(Long courseId, String username) {
        return courseRepository.existsByIdAndInstructor_Username(courseId, username);
    }
}
