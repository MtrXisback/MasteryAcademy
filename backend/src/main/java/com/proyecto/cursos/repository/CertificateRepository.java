package com.proyecto.cursos.repository;

import com.proyecto.cursos.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    @Query("SELECT c FROM Certificate c JOIN FETCH c.user JOIN FETCH c.course WHERE c.user.id = :userId")
    List<Certificate> findByUserId(@Param("userId") Long userId);
    
    Optional<Certificate> findByUserIdAndCourseId(Long userId, Long courseId);
}
