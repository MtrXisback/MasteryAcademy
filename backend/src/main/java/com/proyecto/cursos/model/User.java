package com.proyecto.cursos.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_courses",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"}))
    @JsonIgnoreProperties("enrolledStudents")
    private Set<Course> enrolledCourses = new HashSet<>();

    @Builder.Default
    @Column
    private Integer xp = 0;

    @Builder.Default
    @Column
    private Integer level = 1;

    @Column
    private String fullName;

    @Column
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column
    private String specialty;

    @Builder.Default
    @Column
    private Boolean featured = false;

    @Builder.Default
    @Column
    private String authProvider = "LOCAL";

    public String getAuthProvider() {
        return authProvider == null ? "LOCAL" : authProvider;
    }
}
