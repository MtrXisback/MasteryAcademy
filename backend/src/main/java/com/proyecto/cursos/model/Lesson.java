package com.proyecto.cursos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String title;
    private String description;
    private String contentUrl; // URL del video (YouTube, Vimeo, etc)
    private Integer orderIndex;

    @Column(name = "is_exercise")
    @Builder.Default
    private Boolean isExercise = false;

    @Column(name = "exercise_question", columnDefinition = "TEXT")
    private String exerciseQuestion;

    @Column(name = "exercise_options", columnDefinition = "TEXT")
    private String exerciseOptions; // Opciones separadas por "|"

    @Column(name = "correct_option_index")
    private Integer correctOptionIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private CourseModule courseModule;
}
