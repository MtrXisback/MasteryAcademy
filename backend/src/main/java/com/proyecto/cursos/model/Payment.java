package com.proyecto.cursos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
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
}
