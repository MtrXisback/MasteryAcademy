-- Script de Migración SQL para forzar la integridad de datos (Prevención de Condiciones de Carrera)
-- Este script verifica la existencia de la tabla y crea el índice único compuesto si no existe previamente.

-- Baseline: Asegurar que la tabla pivote exista (por si corremos Flyway en una BD virgen)
CREATE TABLE IF NOT EXISTS user_courses (
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, course_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'uk_user_course_enrollment' 
           OR conrelid = 'user_courses'::regclass
          AND contype = 'u'
    ) THEN
        ALTER TABLE user_courses 
        ADD CONSTRAINT uk_user_course_enrollment UNIQUE (user_id, course_id);
    END IF;
END $$;
