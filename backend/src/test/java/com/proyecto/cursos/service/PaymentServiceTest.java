package com.proyecto.cursos.service;

import com.proyecto.cursos.exception.ResourceAlreadyExistsException;
import com.proyecto.cursos.exception.ResourceNotFoundException;
import com.proyecto.cursos.model.Payment;
import com.proyecto.cursos.repository.PaymentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias (funcionales) de la lógica de pagos, aislando la BD con Mockito.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CourseService courseService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    @DisplayName("CP-PAG-01: Un pago exitoso se registra con estado SUCCESS e inscribe al alumno")
    void registraPagoEInscribe() {
        when(paymentRepository.existsByCulqiChargeId("chr_001")).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment result = paymentService.processSuccessfulPayment(7L, "alumno", 3L, "chr_001", 4999);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertThat(captor.getValue().getAmount()).isEqualTo(4999L);
        assertThat(captor.getValue().getStatus()).isEqualTo("SUCCESS");
        assertThat(result.getCulqiChargeId()).isEqualTo("chr_001");
        verify(courseService).enrollUserInCourse("alumno", 3L);
    }

    @Test
    @DisplayName("CP-PAG-02: Un cargo Culqi repetido es rechazado (idempotencia)")
    void rechazaCargoDuplicado() {
        when(paymentRepository.existsByCulqiChargeId("chr_dup")).thenReturn(true);

        assertThatThrownBy(() -> paymentService.processSuccessfulPayment(7L, "alumno", 3L, "chr_dup", 4999))
                .isInstanceOf(ResourceAlreadyExistsException.class);

        verify(paymentRepository, never()).save(any());
        verify(courseService, never()).enrollUserInCourse(anyString(), anyLong());
    }

    @Test
    @DisplayName("CP-PAG-03: Si la inscripción falla, la excepción se propaga para provocar el rollback")
    void propagaErrorDeInscripcion() {
        when(paymentRepository.existsByCulqiChargeId("chr_002")).thenReturn(false);
        doThrow(new ResourceNotFoundException("Curso", "id", 99L))
                .when(courseService).enrollUserInCourse("alumno", 99L);

        assertThatThrownBy(() -> paymentService.processSuccessfulPayment(7L, "alumno", 99L, "chr_002", 1000))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
