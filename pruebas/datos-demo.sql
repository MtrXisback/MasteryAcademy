-- =====================================================================
-- Datos de demostración - Mastery Academy
-- Crea 15 estudiantes demo, sus inscripciones y pagos de los últimos 6 meses
-- para poblar el Centro de Reportes y los gráficos.
-- Idempotente: se puede ejecutar varias veces sin duplicar datos.
--
-- Uso (con el stack Docker levantado):
--   docker exec -i cursos_db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB' < pruebas/datos-demo.sql
-- Contraseña de todos los usuarios demo: Demo123!
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    nombres TEXT[] := ARRAY['Lucía Ramos','Diego Torres','Valeria Quispe','Mateo Huamán','Camila Rojas',
                            'Sebastián Flores','Daniela Castillo','Andrés Mendoza','Fernanda Chávez','Joaquín Vargas',
                            'Mariana Salazar','Rodrigo Paredes','Ximena Gutiérrez','Gabriel Navarro','Sofía Delgado'];
    student_role BIGINT;
    uid BIGINT;
    course RECORD;
    i INT;
    uname TEXT;
    pago_fecha TIMESTAMP;
BEGIN
    SELECT id INTO student_role FROM roles WHERE name = 'ROLE_STUDENT';

    FOR i IN 1..array_length(nombres, 1) LOOP
        uname := 'demo' || lpad(i::text, 2, '0');

        SELECT id INTO uid FROM users WHERE username = uname;
        IF uid IS NULL THEN
            INSERT INTO users (username, email, password, full_name, xp, level, featured, auth_provider)
            VALUES (uname, uname || '@demo.mastery.pe', crypt('Demo123!', gen_salt('bf', 10)),
                    nombres[i], (random() * 900)::int, 1 + (random() * 4)::int, false, 'LOCAL')
            RETURNING id INTO uid;
            INSERT INTO user_roles (user_id, role_id) VALUES (uid, student_role);
        END IF;

        -- Cada alumno compra entre 1 y todos los cursos publicados, en fechas de los últimos 6 meses
        FOR course IN SELECT id, price FROM courses ORDER BY id LOOP
            IF (i + course.id) % 3 <> 0 AND NOT EXISTS (
                SELECT 1 FROM user_courses WHERE user_id = uid AND course_id = course.id) THEN

                pago_fecha := now() - ((i * 11 + course.id * 7) % 175 || ' days')::interval;

                INSERT INTO user_courses (user_id, course_id) VALUES (uid, course.id);
                INSERT INTO payments (user_id, course_id, culqi_charge_id, amount, status, created_at, updated_at, version)
                VALUES (uid, course.id, 'chr_demo_' || uid || '_' || course.id,
                        round(course.price * 100), 'SUCCESS', pago_fecha, pago_fecha, 0);
            END IF;
        END LOOP;
    END LOOP;
END $$;

SELECT count(*) AS pagos_demo, sum(amount) / 100.0 AS ingresos_usd FROM payments WHERE culqi_charge_id LIKE 'chr_demo_%';
