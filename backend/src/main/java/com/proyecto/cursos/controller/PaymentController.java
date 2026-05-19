package com.proyecto.cursos.controller;

import com.proyecto.cursos.service.CourseService;
import com.proyecto.cursos.service.PaymentService;
import com.proyecto.cursos.repository.UserRepository;
import com.proyecto.cursos.exception.UnauthorizedAccessException;
import com.proyecto.cursos.exception.ResourceAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final CourseService courseService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${culqi.secretKey}")
    private String culqiSecretKey;

    @PostMapping("/culqi")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentData) {
        try {
            String token = (String) paymentData.get("token");
            String email = (String) paymentData.get("email");
            Long courseId = Long.valueOf(paymentData.get("courseId").toString());
            
            String username = SecurityContextHolder.getContext().getAuthentication().getName();

            // 1. Validación de Identidad (Seguridad)
            com.proyecto.cursos.model.User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new com.proyecto.cursos.exception.ResourceNotFoundException("Usuario", "username", username));
            
            if (user.getEmail() == null || !user.getEmail().equalsIgnoreCase(email)) {
                throw new UnauthorizedAccessException("El email proporcionado no coincide con tu sesión actual.");
            }

            // 2. Prevención de Doble Compra
            if (courseService.isUserEnrolled(username, courseId)) {
                throw new ResourceAlreadyExistsException("Ya te encuentras inscrito en este programa premium.");
            }

            // 3. Cálculo seguro de monto
            com.proyecto.cursos.model.Course course = courseService.getCourseById(courseId);
            Integer calculatedAmount = (int) Math.round(course.getPrice() * 100);

            // 4. Llamada a Culqi
            String url = "https://api.culqi.com/v2/charges";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(culqiSecretKey);

            Map<String, Object> body = new HashMap<>();
            body.put("amount", calculatedAmount);
            body.put("currency_code", "USD");
            body.put("email", email);
            body.put("source_id", token);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED || response.getStatusCode() == HttpStatus.OK) {
                String chargeId = (String) response.getBody().get("id");
                
                // 5. Transacción Atómica: Guardar Pago e Inscribir
                paymentService.processSuccessfulPayment(user.getId(), username, courseId, chargeId, calculatedAmount);
                
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Pago procesado e inscripción completada",
                    "chargeId", chargeId
                ));
            } else {
                org.springframework.http.ProblemDetail errorDetail = org.springframework.http.ProblemDetail.forStatusAndDetail(
                        response.getStatusCode(), 
                        "El proveedor de pagos rechazó la transacción."
                );
                errorDetail.setTitle("Pago Rechazado");
                errorDetail.setProperty("timestamp", java.time.Instant.now());
                return ResponseEntity.status(response.getStatusCode()).body(errorDetail);
            }

        } catch (com.proyecto.cursos.exception.ResourceNotFoundException | UnauthorizedAccessException | ResourceAlreadyExistsException | org.springframework.dao.DataIntegrityViolationException domainEx) {
            // Re-lanzar excepciones de dominio para que las capture el GlobalExceptionHandler
            throw domainEx;
        } catch (org.springframework.web.client.RestClientResponseException restEx) {
            org.springframework.http.ProblemDetail errorDetail = org.springframework.http.ProblemDetail.forStatusAndDetail(
                    restEx.getStatusCode(), 
                    "El proveedor de pagos rechazó la transacción u ocurrió un error HTTP."
            );
            errorDetail.setTitle("Error de Pasarela");
            errorDetail.setProperty("timestamp", java.time.Instant.now());
            return ResponseEntity.status(restEx.getStatusCode()).body(errorDetail);
        } catch (Exception e) {
            // Control de Fuga de Errores: Contrato homogéneo RFC 7807
            org.springframework.http.ProblemDetail problemDetail = org.springframework.http.ProblemDetail.forStatusAndDetail(
                    HttpStatus.BAD_REQUEST, 
                    "Ocurrió un error interno al procesar el pago de forma segura."
            );
            problemDetail.setTitle("Error de Pasarela");
            problemDetail.setProperty("timestamp", java.time.Instant.now());
            return ResponseEntity.badRequest().body(problemDetail);
        }
    }
}
