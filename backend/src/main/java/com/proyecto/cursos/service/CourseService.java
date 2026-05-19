package com.proyecto.cursos.service;

import com.proyecto.cursos.model.*;
import com.proyecto.cursos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.proyecto.cursos.exception.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final UserProgressRepository progressRepository;
    private final GamificationService gamificationService;
    private final NotificationService notificationService;

    @Transactional
    public void markLessonAsCompleted(String username, Long lessonId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lección", "id", lessonId));

        if (progressRepository.findByUserIdAndLessonId(user.getId(), lessonId).isEmpty()) {
            UserProgress progress = UserProgress.builder()
                    .user(user)
                    .lesson(lesson)
                    .build();
            progressRepository.save(progress);
            
            // Recompensa XP
            gamificationService.addXp(username, gamificationService.getXpForLesson());

            // Notificar progreso
            notificationService.createNotification(
                user,
                "¡Lección Dominada! ✅",
                "Has completado '" + lesson.getTitle() + "'. ¡Tu conocimiento aumenta!",
                com.proyecto.cursos.model.Notification.ENotificationType.SUCCESS,
                "ROLE_STUDENT"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getCompletedLessonIds(String username, Long courseId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        return progressRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .stream()
                .map(up -> up.getLesson().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseModule addModule(Long courseId, CourseModule module) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Curso", "id", courseId));
        module.setCourse(course);
        return moduleRepository.save(module);
    }

    @Transactional
    public void deleteModule(Long moduleId) {
        moduleRepository.deleteById(moduleId);
    }

    @Transactional
    public Lesson addLesson(Long moduleId, Lesson lesson) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Módulo", "id", moduleId));
        lesson.setCourseModule(module);
        return lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Long lessonId) {
        lessonRepository.deleteById(lessonId);
    }

    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Course> searchCourses(String title, Long categoryId, Long instructorId, String level, org.springframework.data.domain.Pageable pageable) {
        String searchTitle = (title != null && !title.isEmpty()) ? "%" + title.toLowerCase() + "%" : null;
        
        ECourseLevel enumLevel = null;
        if (level != null && !level.isEmpty() && !level.equalsIgnoreCase("All")) {
            try {
                enumLevel = ECourseLevel.valueOf(level.toUpperCase());
            } catch (IllegalArgumentException e) {
            }
        }
        return courseRepository.searchCourses(searchTitle, categoryId, instructorId, enumLevel, pageable);
    }

    @Transactional
    public Course createCourse(Course course, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        course.setInstructor(user);
        if (course.getStatus() == null) {
            course.setStatus(ECourseStatus.DRAFT);
        }
        Course saved = courseRepository.save(course);

        // Notificar creación al instructor (ROLE_INSTRUCTOR)
        notificationService.createNotification(
            user,
            "Borrador Creado 📑",
            "Tu programa '" + course.getTitle() + "' ha sido creado como borrador. Puedes comenzar a añadir módulos y lecciones.",
            com.proyecto.cursos.model.Notification.ENotificationType.SUCCESS,
            "ROLE_INSTRUCTOR"
        );

        return saved;
    }

    @Transactional
    public Course updateCourse(Long id, Course courseDetails) {
        return courseRepository.findById(id)
                .map(course -> {
                    course.setTitle(courseDetails.getTitle());
                    course.setDescription(courseDetails.getDescription());
                    // El instructor no debería cambiarse por un simple string en el update
                    course.setPrice(courseDetails.getPrice());
                    course.setCategory(courseDetails.getCategory());
                    course.setLevel(courseDetails.getLevel());
                    course.setStatus(courseDetails.getStatus());
                    course.setDuration(courseDetails.getDuration());
                    return courseRepository.save(course);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Curso", "id", id));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    @Transactional
    public void enrollUserInCourse(String username, Long courseId) {
        User user = userRepository.findWithCoursesByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Curso", "id", courseId));

        user.getEnrolledCourses().add(course);
        userRepository.save(user);

        // Notificar éxito de inscripción al alumno (ROLE_STUDENT)
        notificationService.createNotification(
            user,
            "¡Inscripción Exitosa! 🎓",
            "Ya tienes acceso a: " + course.getTitle() + ". ¡Es hora de dominar el mercado!",
            com.proyecto.cursos.model.Notification.ENotificationType.SUCCESS,
            "ROLE_STUDENT"
        );

        // Notificar al instructor del curso (ROLE_INSTRUCTOR)
        if (course.getInstructor() != null) {
            notificationService.createNotification(
                course.getInstructor(),
                "¡Nuevo Alumno Inscrito! 📈",
                "El usuario @" + user.getUsername() + " se ha inscrito en tu programa '" + course.getTitle() + "'. ¡Tu comunidad sigue creciendo!",
                com.proyecto.cursos.model.Notification.ENotificationType.INFO,
                "ROLE_INSTRUCTOR"
            );
        }
    }

    @Transactional(readOnly = true)
    public Set<Course> getUserEnrolledCourses(String username) {
        User user = userRepository.findWithCoursesByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        return user.getEnrolledCourses();
    }

    @Transactional(readOnly = true)
    public boolean isUserEnrolled(String username, Long courseId) {
        User user = userRepository.findWithCoursesByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        return user.getEnrolledCourses().stream()
                .anyMatch(course -> course.getId().equals(courseId));
    }

    @Transactional(readOnly = true)
    public Course getCourseWithContent(Long id) {
        return courseRepository.findByIdWithContent(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso", "id", id));
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso", "id", id));
    }
}
