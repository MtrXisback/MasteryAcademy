package com.proyecto.cursos.service;

import com.proyecto.cursos.model.Payment;
import com.proyecto.cursos.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseService courseService;

    @Transactional
    public void processSuccessfulPayment(Long userId, String username, Long courseId, String chargeId, Integer amount) {
        // 1. Trazabilidad de pago (Guardar en DB)
        Payment payment = Payment.builder()
                .userId(userId)
                .courseId(courseId)
                .culqiChargeId(chargeId)
                .amount(Long.valueOf(amount))
                .status("SUCCESS")
                .build();
        paymentRepository.save(payment);

        // 2. Inscribir al usuario (Si falla, se hace rollback automático de todo el bloque)
        courseService.enrollUserInCourse(username, courseId);
    }
}
