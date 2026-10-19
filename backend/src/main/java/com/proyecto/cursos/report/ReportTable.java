package com.proyecto.cursos.report;

import java.util.List;

/**
 * Estructura tabular neutra que alimenta a todos los exportadores (PDF, Excel, CSV).
 *
 * @param title    título del reporte
 * @param subtitle filtros aplicados / descripción
 * @param headers  cabeceras de columnas
 * @param rows     filas de datos (String, Number o LocalDateTime)
 * @param footer   fila de totales (puede ser null)
 */
public record ReportTable(String title, String subtitle, List<String> headers, List<List<Object>> rows, List<Object> footer) {
}
