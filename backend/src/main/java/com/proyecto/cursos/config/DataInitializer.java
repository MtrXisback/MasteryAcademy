package com.proyecto.cursos.config;

import com.proyecto.cursos.model.*;
import com.proyecto.cursos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashSet;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    @Value("${proyecto.app.adminDefaultPassword}")
    private String adminDefaultPassword;

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final CategoryRepository categoryRepository;
    private final NewsRepository newsRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        // Inicializar Categorías
        if (categoryRepository.count() == 0) {
            categoryRepository.save(new Category(null, "Trading General", "Fundamentos y conceptos básicos."));
            categoryRepository.save(new Category(null, "Forex", "Mercado de divisas."));
            categoryRepository.save(new Category(null, "Criptoactivos", "Bitcoin, Ethereum y más."));
            categoryRepository.save(new Category(null, "Acciones", "Mercado bursátil tradicional."));
        }

        // Inicializar Roles
        if (roleRepository.findByName(ERole.ROLE_STUDENT).isEmpty()) {
            roleRepository.save(new Role(null, ERole.ROLE_STUDENT));
        }
        if (roleRepository.findByName(ERole.ROLE_INSTRUCTOR).isEmpty()) {
            roleRepository.save(new Role(null, ERole.ROLE_INSTRUCTOR));
        }
        if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
            roleRepository.save(new Role(null, ERole.ROLE_ADMIN));
        }

        // Inicializar o Actualizar Admin
        User admin = userRepository.findByUsername("admin").orElse(null);
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).get();
        Role instructorRole = roleRepository.findByName(ERole.ROLE_INSTRUCTOR).get();
        Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT).get();

        if (admin == null) {
            String adminPassword = adminDefaultPassword;
            if (adminPassword == null || adminPassword.isBlank()) {
                adminPassword = "AdminStrongPass123!";
                System.out.println("WARNING: Using default admin password. Please configure ADMIN_DEFAULT_PASSWORD.");
            }

            admin = User.builder()
                    .username("admin")
                    .email("admin@cursos.com")
                    .roles(new HashSet<>(List.of(adminRole, instructorRole, studentRole)))
                    .featured(true)
                    .fullName("Christian Valenzuela")
                    .avatarUrl("https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=500")
                    .bio("Director y Fundador de Mastery Academy. Ex-Gestor de Fondos de Inversión y experto en mercados institucionales y liquidez bancaria.")
                    .specialty("Trading Institucional & Macro")
                    .password(passwordEncoder.encode(adminPassword))
                    .build();
            userRepository.save(admin);
        } else {
            admin.getRoles().add(instructorRole);
            admin.setFeatured(true);
            admin.setFullName("Christian Valenzuela");
            admin.setSpecialty("Trading Institucional & Macro");
            admin.setBio("Director y Fundador de Mastery Academy. Ex-Gestor de Fondos de Inversión y experto en mercados institucionales y liquidez bancaria.");
            admin.setAvatarUrl("https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=500");
            userRepository.save(admin);
        }

        // Inicializar Juan Merino (Profesor Estrella)
        User juan = userRepository.findByUsername("juanmerino").orElse(null);
        if (juan == null) {
            juan = User.builder()
                    .username("juanmerino")
                    .email("juan.merino@academy.com")
                    .roles(new HashSet<>(List.of(instructorRole, studentRole)))
                    .featured(true)
                    .fullName("Juan Merino")
                    .avatarUrl("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=500")
                    .bio("Juan Merino es un trader profesional con más de 15 años de experiencia en mercados financieros internacionales. Especialista en Price Action, Order Blocks y Psicología de Trading de Élite.")
                    .specialty("Price Action & Scalping")
                    .build();
            juan.setPassword(passwordEncoder.encode("juan123"));
            userRepository.save(juan);
        } else {
            juan.setFeatured(true);
            juan.setFullName("Juan Merino");
            juan.setSpecialty("Price Action & Scalping");
            juan.setBio("Juan Merino es un trader profesional con más de 15 años de experiencia en mercados financieros internacionales. Especialista en Price Action, Order Blocks y Psicología de Trading de Élite.");
            juan.setAvatarUrl("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=500");
            userRepository.save(juan);
        }
        final User starInstructor = juan;

        // Asegurar que TODOS los cursos existentes tengan a Juan como mentor
        List<Course> allCourses = courseRepository.findAll();
        if (!allCourses.isEmpty()) {
            allCourses.forEach(c -> {
                if (c.getInstructor() == null || !c.getInstructor().getUsername().equals("juanmerino")) {
                    c.setInstructor(starInstructor);
                    courseRepository.save(c);
                }
            });
        }

        // Inicializar Cursos, Módulos y Lecciones
        if (courseRepository.count() == 0) {
            // Seed News
            if (newsRepository.count() == 0) {
                newsRepository.save(News.builder()
                        .title("FED: Tasas de Interés sin Cambios")
                        .content("Jerome Powell sugiere que el pivot podría tardar más de lo esperado. El Oro reacciona a la baja.")
                        .tag("MACRO")
                        .sentiment("bearish")
                        .imageUrl("/assets/news_macro.png")
                        .build());
                
                newsRepository.save(News.builder()
                        .title("Bitcoin ETF: Entradas Record")
                        .content("Más de $1.2B fluyen hacia los ETFs de BTC en las últimas 24 horas. Resistencia en los $74k.")
                        .tag("CRYPTO")
                        .sentiment("bullish")
                        .imageUrl("/assets/news_crypto.png")
                        .build());

                newsRepository.save(News.builder()
                        .title("Apertura de Londres: GBP/USD")
                        .content("Análisis de liquidez en la sesión europea. Posible manipulación por encima del rango de Asia.")
                        .tag("FOREX")
                        .sentiment("volatile")
                        .imageUrl("/assets/news_forex.png")
                        .build());
            }
            Category tradingCat = categoryRepository.findByName("Trading General")
                    .orElseGet(() -> categoryRepository.save(new Category(null, "Trading General", "Fundamentos y conceptos básicos.")));

            Course springCourse = courseRepository.save(Course.builder()
                    .title("Master en Trading Institucional")
                    .description("Domina la liquidez, los order blocks y la manipulación de mercado como un profesional.")
                    .instructor(starInstructor)
                    .price(99.99)
                    .imageUrl("/assets/course_institutional.png")
                    .category(tradingCat)
                    .level(ECourseLevel.ADVANCED)
                    .status(ECourseStatus.PUBLISHED)
                    .duration(45.5)
                    .build());

            CourseModule springModule1 = moduleRepository.save(CourseModule.builder()
                    .name("Fundamentos Institucionales")
                    .orderIndex(1)
                    .course(springCourse)
                    .build());

            lessonRepository.save(Lesson.builder()
                    .title("¿Quiénes mueven el mercado?")
                    .description("Introducción a la liquidez bancaria.")
                    .contentUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")
                    .orderIndex(1)
                    .courseModule(springModule1)
                    .build());

            lessonRepository.save(Lesson.builder()
                    .title("Ejercicio: Estructura del Mercado")
                    .description("Práctica interactiva para identificar soportes institucionales.")
                    .contentUrl("")
                    .orderIndex(2)
                    .isExercise(true)
                    .exerciseQuestion("¿En qué nivel se produce mayormente la acumulación institucional de órdenes de compra?")
                    .exerciseOptions("En zonas de alta liquidez por debajo de mínimos anteriores (Order Blocks)|En el cruce de cualquier media móvil simple|Donde el oscilador estocástico da sobrecompra|Únicamente al cierre de la sesión de Nueva York")
                    .correctOptionIndex(0)
                    .courseModule(springModule1)
                    .build());

            courseRepository.save(Course.builder()
                    .title("Cripto Elite: Futuros y Defi")
                    .description("Estrategias avanzadas para el mercado de criptoactivos y finanzas descentralizadas.")
                    .instructor(starInstructor)
                    .price(149.99)
                    .imageUrl("/assets/course_crypto.png")
                    .category(categoryRepository.findByName("Criptoactivos").get())
                    .level(ECourseLevel.INTERMEDIATE)
                    .status(ECourseStatus.PUBLISHED)
                    .duration(32.0)
                    .build());

            courseRepository.save(Course.builder()
                    .title("Psicología del Éxito: Mindset de Trader")
                    .description("Domina tus emociones y desarrolla la disciplina de los grandes gestores de fondos.")
                    .instructor(starInstructor)
                    .price(59.99)
                    .imageUrl("/assets/course_mindset.png")
                    .category(tradingCat)
                    .level(ECourseLevel.BEGINNER)
                    .status(ECourseStatus.PUBLISHED)
                    .duration(15.0)
                    .build());
        }

        // Inicializar Quiz si no existe
        if (quizRepository.count() == 0 && courseRepository.count() > 0) {
            Course course = courseRepository.findAll().get(0);
            Quiz quiz = Quiz.builder()
                    .title("Examen Final: " + course.getTitle())
                    .description("Valida tus conocimientos para obtener el certificado.")
                    .passingScore(70)
                    .course(course)
                    .build();

            Question q1 = Question.builder()
                    .text("¿Qué es un 'Order Block' en el Trading Institucional?")
                    .options(List.of("Un bloque de código de Spring Boot", "Una zona de oferta o demanda donde las instituciones acumulan órdenes", "Un patrón de velas que indica indecisión", "Un tipo de orden límite en Forex"))
                    .correctAnswerIndex(1)
                    .quiz(quiz)
                    .build();

            Question q2 = Question.builder()
                    .text("En el Trading Institucional, ¿qué representa la liquidez en un gráfico?")
                    .options(List.of("La velocidad de carga de la página", "Zonas por encima o debajo de máximos/mínimos con órdenes Stop Loss pendientes", "El volumen diario total de acciones de Tesla", "Un indicador técnico basado en medias móviles"))
                    .correctAnswerIndex(1)
                    .quiz(quiz)
                    .build();

            quiz.setQuestions(List.of(q1, q2));
            quizRepository.save(quiz);
        }
    }
}
