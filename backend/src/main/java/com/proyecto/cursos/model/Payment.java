package com.proyecto.cursos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long courseId;
    
    @Column(unique = true)
    private String culqiChargeId;
    
    private Long amount; // en centavos
    private String status; 

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Auditoría: última modificación del registro (Spring Data JPA Auditing)
    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Bloqueo optimista: evita que dos transacciones sobrescriban el mismo pago
    @Version
    @Column(columnDefinition = "bigint default 0 not null")
    private Long version;
}
