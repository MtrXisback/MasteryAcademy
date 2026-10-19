package com.proyecto.cursos.service;

import com.proyecto.cursos.exception.ResourceAlreadyExistsException;
import com.proyecto.cursos.model.Payment;
import com.proyecto.cursos.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseService courseService;

    /**
     * Unidad de trabajo atómica (ACID): registrar el pago e inscribir al alumno.
     * Si cualquier paso falla (incluidas excepciones checked) se revierte todo el bloque.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public Payment processSuccessfulPayment(Long userId, String username, Long courseId, String chargeId, Integer amount) {
        // 0. Idempotencia: un mismo cargo de Culqi no puede registrarse dos veces
        if (paymentRepository.existsByCulqiChargeId(chargeId)) {
            throw new ResourceAlreadyExistsException("El cargo " + chargeId + " ya fue registrado.");
        }

        // 1. Trazabilidad de pago (Guardar en DB)
        Payment payment = Payment.builder()
                .userId(userId)
                .courseId(courseId)
                .culqiChargeId(chargeId)
                .amount(Long.valueOf(amount))
                .status("SUCCESS")
                .build();
        Payment saved = paymentRepository.save(payment);

        // 2. Inscribir al usuario (Si falla, se hace rollback automático de todo el bloque)
        courseService.enrollUserInCourse(username, courseId);
        return saved;
    }
}
