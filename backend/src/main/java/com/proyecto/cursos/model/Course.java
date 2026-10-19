package com.proyecto.cursos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String title;
    private String description;
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"enrolledCourses", "enrolledStudents"})
    private User instructor;

    private Double price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    private ECourseLevel level;

    @Enumerated(EnumType.STRING)
    private ECourseStatus status;

    private Double duration;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private java.util.Set<CourseModule> modules = new java.util.LinkedHashSet<>();

    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    // Auditoría: usuario que creó / modificó por última vez el curso
    @org.springframework.data.annotation.CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @org.springframework.data.annotation.LastModifiedBy
    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    // Bloqueo optimista: Hibernate incrementa la versión en cada UPDATE y rechaza escrituras con versión obsoleta
    @Version
    @Column(columnDefinition = "bigint default 0 not null")
    private Long version;

    @ManyToMany(mappedBy = "enrolledCourses")
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private java.util.Set<User> enrolledStudents = new java.util.HashSet<>();

    @jakarta.persistence.PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
        if (status == null) status = ECourseStatus.DRAFT;
        if (level == null) level = ECourseLevel.BEGINNER;
    }

    @jakarta.persistence.PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
