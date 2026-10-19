package com.proyecto.cursos.controller;

import com.proyecto.cursos.report.ReportExporter;
import com.proyecto.cursos.report.ReportFormat;
import com.proyecto.cursos.report.ReportService;
import com.proyecto.cursos.report.ReportTable;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;
    private final ReportExporter reportExporter;

    /** Indicadores para el panel de reportes (visualización). */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(reportService.summary());
    }

    /**
     * Descarga un reporte en el formato indicado.
     * Ej: GET /api/reports/ventas?format=pdf&from=2026-01-01&to=2026-10-31
     */
    @GetMapping("/{type}")
    public ResponseEntity<byte[]> export(@PathVariable String type,
                                         @RequestParam(defaultValue = "pdf") String format,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        ReportService.ReportType reportType;
        ReportFormat reportFormat;
        try {
            reportType = ReportService.ReportType.valueOf(type.toUpperCase());
            reportFormat = ReportFormat.from(format);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        ReportTable table = reportService.build(reportType, from, to);
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        byte[] content = reportExporter.export(table, reportFormat, user);

        String filename = "reporte-" + type.toLowerCase() + "-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + "." + reportFormat.getExtension();
        return ResponseEntity.ok()
                .contentType(reportFormat.getMediaType())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(content);
    }
}
