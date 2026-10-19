package com.proyecto.cursos.integration;

import com.proyecto.cursos.exception.ResourceNotFoundException;
import com.proyecto.cursos.model.Course;
import com.proyecto.cursos.model.ECourseStatus;
import com.proyecto.cursos.model.ERole;
import com.proyecto.cursos.model.User;
import com.proyecto.cursos.repository.CourseRepository;
import com.proyecto.cursos.repository.PaymentRepository;
import com.proyecto.cursos.repository.RoleRepository;
import com.proyecto.cursos.repository.UserRepository;
import com.proyecto.cursos.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pruebas de integración: levantan el contexto completo de Spring (controladores, servicios,
 * repositorios, JPA y la BD H2) para validar la seguridad transaccional extremo a extremo.
 * No se anota con @Transactional a propósito: cada llamada usa su propia transacción real.
 */
@SpringBootTest
@ActiveProfiles("test")
class TransactionIntegrationTest {

    @Autowired private PaymentService paymentService;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;

    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        student = userRepository.save(User.builder()
                .username("it_" + suffix)
                .email("it_" + suffix + "@test.com")
                .password("x")
                .roles(Set.of(roleRepository.findByName(ERole.ROLE_STUDENT).orElseThrow()))
                .build());
        course = courseRepository.save(Course.builder()
                .title("Curso IT " + suffix)
                .price(49.99)
                .status(ECourseStatus.PUBLISHED)
                .build());
    }

    @Test
    @DisplayName("CP-INT-01: Pago + inscripción se confirman juntos (commit)")
    void commitPagoEInscripcion() {
        long before = paymentRepository.count();

        paymentService.processSuccessfulPayment(student.getId(), student.getUsername(), course.getId(), "chr_ok_" + student.getId(), 4999);

        assertThat(paymentRepository.count()).isEqualTo(before + 1);
        User reloaded = userRepository.findWithCoursesByUsername(student.getUsername()).orElseThrow();
        assertThat(reloaded.getEnrolledCourses()).extracting(Course::getId).contains(course.getId());
    }

    @Test
    @DisplayName("CP-INT-02: Si la inscripción falla, el pago ya guardado se revierte (rollback)")
    void rollbackSiFallaInscripcion() {
        long before = paymentRepository.count();
        String chargeId = "chr_rollback_" + student.getId();

        assertThatThrownBy(() -> paymentService.processSuccessfulPayment(student.getId(), student.getUsername(), 999_999L, chargeId, 4999))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThat(paymentRepository.count()).isEqualTo(before);
        assertThat(paymentRepository.existsByCulqiChargeId(chargeId)).isFalse();
    }

    @Test
    @DisplayName("CP-INT-03: Bloqueo optimista rechaza una actualización con versión obsoleta")
    void bloqueoOptimista() {
        Course copiaA = courseRepository.findById(course.getId()).orElseThrow();
        Course copiaB = courseRepository.findById(course.getId()).orElseThrow();
        assertThat(copiaA.getVersion()).isEqualTo(copiaB.getVersion());

        copiaA.setTitle("Editado por admin A");
        courseRepository.save(copiaA);

        copiaB.setTitle("Editado por admin B");
        assertThatThrownBy(() -> courseRepository.save(copiaB))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);

        Course actual = courseRepository.findById(course.getId()).orElseThrow();
        assertThat(actual.getTitle()).isEqualTo("Editado por admin A");
        assertThat(actual.getVersion()).isEqualTo(copiaA.getVersion() + 1);
    }

    @Test
    @DisplayName("CP-INT-04: La auditoría registra el usuario creador del curso")
    void auditoriaCreador() {
        assertThat(course.getCreatedBy()).isEqualTo("system");
        assertThat(course.getCreatedAt()).isNotNull();
    }
}
