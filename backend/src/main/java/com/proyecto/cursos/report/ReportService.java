package com.proyecto.cursos.report;

import com.proyecto.cursos.model.ERole;
import com.proyecto.cursos.model.Payment;
import com.proyecto.cursos.repository.CourseRepository;
import com.proyecto.cursos.repository.PaymentRepository;
import com.proyecto.cursos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Capa de negocio de reportes: consulta la BD y arma las tablas que luego se exportan.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    public enum ReportType { VENTAS, INSCRIPCIONES, ESTUDIANTES }

    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public ReportTable build(ReportType type, LocalDate from, LocalDate to) {
        return switch (type) {
            case VENTAS -> salesReport(from, to);
            case INSCRIPCIONES -> enrollmentReport();
            case ESTUDIANTES -> studentReport();
        };
    }

    /** Reporte de ventas (pagos Culqi) en un rango de fechas. */
    public ReportTable salesReport(LocalDate from, LocalDate to) {
        LocalDate start = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate end = to != null ? to : LocalDate.now();
        List<Object[]> data = paymentRepository.findSalesBetween(start.atStartOfDay(), end.plusDays(1).atStartOfDay());

        List<List<Object>> rows = new ArrayList<>();
        double total = 0;
        for (Object[] r : data) {
            Payment p = (Payment) r[0];
            double amount = p.getAmount() == null ? 0 : p.getAmount() / 100.0;
            if ("SUCCESS".equals(p.getStatus())) total += amount;
            String student = r[2] != null ? (String) r[2] : (String) r[1];
            rows.add(java.util.Arrays.asList(
                    p.getId(),
                    p.getCreatedAt(),
                    nvl(student, "Usuario #" + p.getUserId()),
                    nvl((String) r[3], "Curso #" + p.getCourseId()),
                    nvl(p.getCulqiChargeId(), "-"),
                    nvl(p.getStatus(), "-"),
                    amount));
        }

        String subtitle = "Periodo: " + (from != null ? start.format(D) : "inicio") + " al " + end.format(D) + " · Montos en USD";
        return new ReportTable("Reporte de Ventas",
                subtitle,
                List.of("ID", "Fecha", "Alumno", "Curso", "Cargo Culqi", "Estado", "Monto (USD)"),
                rows,
                List.of("", "", "", "", "", "TOTAL", total));
    }

    /** Reporte de inscripciones e ingresos por curso. */
    public ReportTable enrollmentReport() {
        Map<Long, Object[]> revenue = new HashMap<>();
        for (Object[] r : paymentRepository.sumRevenueByCourse()) {
            revenue.put((Long) r[0], r);
        }

        List<List<Object>> rows = new ArrayList<>();
        long totalEnrolled = 0;
        double totalRevenue = 0;
        for (Object[] c : courseRepository.findEnrollmentSummary()) {
            Long id = (Long) c[0];
            int enrolled = ((Number) c[6]).intValue();
            Object[] rev = revenue.get(id);
            double income = rev != null && rev[1] != null ? ((Number) rev[1]).longValue() / 100.0 : 0.0;
            totalEnrolled += enrolled;
            totalRevenue += income;
            rows.add(java.util.Arrays.asList(
                    id,
                    nvl((String) c[1], "-"),
                    nvl((String) c[2], "Sin categoría"),
                    nvl((String) c[3], "-"),
                    c[4] != null ? c[4].toString() : "-",
                    c[5] != null ? ((Number) c[5]).doubleValue() : 0.0,
                    enrolled,
                    income));
        }

        return new ReportTable("Reporte de Inscripciones por Curso",
                "Alumnos inscritos e ingresos acumulados por programa",
                List.of("ID", "Curso", "Categoría", "Instructor", "Estado", "Precio (USD)", "Inscritos", "Ingresos (USD)"),
                rows,
                List.of("", "", "", "", "", "TOTAL", totalEnrolled, totalRevenue));
    }

    /** Reporte de estudiantes con su avance de gamificación. */
    public ReportTable studentReport() {
        List<List<Object>> rows = new ArrayList<>();
        for (Object[] u : userRepository.findStudentSummary(ERole.ROLE_STUDENT)) {
            rows.add(java.util.Arrays.asList(
                    nvl((String) u[0], "-"),
                    nvl((String) u[1], "-"),
                    nvl((String) u[2], "-"),
                    u[3] != null ? ((Number) u[3]).intValue() : 1,
                    u[4] != null ? ((Number) u[4]).intValue() : 0,
                    ((Number) u[5]).intValue(),
                    nvl((String) u[6], "LOCAL")));
        }
        return new ReportTable("Reporte de Estudiantes",
                "Estudiantes registrados ordenados por experiencia (XP)",
                List.of("Usuario", "Nombre", "Email", "Nivel", "XP", "Cursos inscritos", "Proveedor"),
                rows,
                null);
    }

    /** Indicadores y series para los gráficos del panel de reportes. */
    public Map<String, Object> summary() {
        LocalDate today = LocalDate.now();
        YearMonth firstMonth = YearMonth.from(today).minusMonths(5);
        List<Object[]> sales = paymentRepository.findSalesBetween(firstMonth.atDay(1).atStartOfDay(), today.plusDays(1).atStartOfDay());

        Map<String, Double> revenueByMonth = new LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            revenueByMonth.put(firstMonth.plusMonths(i).toString(), 0.0);
        }
        for (Object[] r : sales) {
            Payment p = (Payment) r[0];
            if (!"SUCCESS".equals(p.getStatus()) || p.getCreatedAt() == null) continue;
            revenueByMonth.merge(YearMonth.from(p.getCreatedAt()).toString(), p.getAmount() / 100.0, Double::sum);
        }

        ReportTable enrollment = enrollmentReport();
        List<Map<String, Object>> topCourses = enrollment.rows().stream()
                .limit(5)
                .map(r -> Map.<String, Object>of("title", r.get(1), "enrolled", r.get(6), "revenue", r.get(7)))
                .toList();

        List<Map<String, Object>> monthly = revenueByMonth.entrySet().stream()
                .map(e -> Map.<String, Object>of("month", e.getKey(), "revenue", e.getValue()))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", enrollment.footer().get(7));
        result.put("totalEnrollments", enrollment.footer().get(6));
        result.put("totalPayments", paymentRepository.count());
        result.put("totalCourses", enrollment.rows().size());
        result.put("totalStudents", userRepository.findStudentSummary(ERole.ROLE_STUDENT).size());
        result.put("revenueByMonth", monthly);
        result.put("topCourses", topCourses);
        result.put("generatedAt", LocalDateTime.now());
        return result;
    }

    private static String nvl(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
