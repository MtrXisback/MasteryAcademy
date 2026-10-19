package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByCulqiChargeId(String culqiChargeId);

    /** Ventas con datos del alumno y curso: [Payment, username, fullName, courseTitle] */
    @Query("SELECT p, u.username, u.fullName, c.title FROM Payment p " +
           "LEFT JOIN User u ON u.id = p.userId " +
           "LEFT JOIN Course c ON c.id = p.courseId " +
           "WHERE p.createdAt >= :from AND p.createdAt < :to " +
           "ORDER BY p.createdAt DESC")
    List<Object[]> findSalesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Ingresos y número de ventas por curso: [courseId, sum(amount), count] */
    @Query("SELECT p.courseId, SUM(p.amount), COUNT(p) FROM Payment p WHERE p.status = 'SUCCESS' GROUP BY p.courseId")
    List<Object[]> sumRevenueByCourse();
}
