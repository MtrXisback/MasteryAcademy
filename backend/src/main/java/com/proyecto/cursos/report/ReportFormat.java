package com.proyecto.cursos.report;

import org.springframework.http.MediaType;

public enum ReportFormat {
    PDF("pdf", MediaType.APPLICATION_PDF),
    XLSX("xlsx", MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
    CSV("csv", MediaType.parseMediaType("text/csv; charset=UTF-8"));

    private final String extension;
    private final MediaType mediaType;

    ReportFormat(String extension, MediaType mediaType) {
        this.extension = extension;
        this.mediaType = mediaType;
    }

    public String getExtension() {
        return extension;
    }

    public MediaType getMediaType() {
        return mediaType;
    }

    public static ReportFormat from(String value) {
        for (ReportFormat f : values()) {
            if (f.extension.equalsIgnoreCase(value) || f.name().equalsIgnoreCase(value)) {
                return f;
            }
        }
        throw new IllegalArgumentException("Formato de reporte no soportado: " + value);
    }
}
