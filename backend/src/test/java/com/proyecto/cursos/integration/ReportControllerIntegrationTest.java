package com.proyecto.cursos.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración de la API de reportes: seguridad por roles y formatos de exportación.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReportControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("CP-REP-01: Sin token JWT la API de reportes responde 401")
    void sinAutenticacion() throws Exception {
        mockMvc.perform(get("/api/reports/ventas")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alumno", roles = "STUDENT")
    @DisplayName("CP-REP-02: Un estudiante no puede descargar reportes (403)")
    void estudianteProhibido() throws Exception {
        mockMvc.perform(get("/api/reports/ventas")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("CP-REP-03: Reporte de ventas en PDF")
    void ventasPdf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/reports/ventas").param("format", "pdf")
                        .param("from", "2026-01-01").param("to", "2026-12-31"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".pdf")))
                .andReturn();
        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(new String(body, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("CP-REP-04: Reporte de inscripciones en Excel (XLSX)")
    void inscripcionesExcel() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/reports/inscripciones").param("format", "xlsx"))
                .andExpect(status().isOk())
                .andReturn();
        byte[] body = result.getResponse().getContentAsByteArray();
        // Los .xlsx son archivos ZIP: empiezan con la firma "PK"
        assertThat(body[0]).isEqualTo((byte) 'P');
        assertThat(body[1]).isEqualTo((byte) 'K');
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("CP-REP-05: Reporte de estudiantes en CSV con cabeceras")
    void estudiantesCsv() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/reports/estudiantes").param("format", "csv"))
                .andExpect(status().isOk())
                .andReturn();
        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(csv).contains("Usuario,Nombre,Email,Nivel,XP");
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("CP-REP-06: Formato o tipo inválido responde 400")
    void formatoInvalido() throws Exception {
        mockMvc.perform(get("/api/reports/ventas").param("format", "docx")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/reports/inexistente")).andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("CP-REP-07: El resumen del panel devuelve KPIs y series para gráficos")
    void resumen() throws Exception {
        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").exists())
                .andExpect(jsonPath("$.revenueByMonth.length()").value(6))
                .andExpect(jsonPath("$.topCourses").isArray());
    }
}
