package com.proyecto.cursos.report;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Convierte un {@link ReportTable} al formato solicitado (PDF, XLSX o CSV).
 */
@Component
public class ReportExporter {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color BRAND_DARK = new Color(17, 24, 39);
    private static final Color BRAND_GOLD = new Color(212, 175, 55);

    public byte[] export(ReportTable table, ReportFormat format, String generatedBy) {
        return switch (format) {
            case PDF -> toPdf(table, generatedBy);
            case XLSX -> toXlsx(table, generatedBy);
            case CSV -> toCsv(table);
        };
    }

    // ------------------------------------------------------------------ PDF
    private byte[] toPdf(ReportTable table, String generatedBy) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        PdfWriter.getInstance(document, out);
        document.open();

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BRAND_GOLD);
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BRAND_DARK);
        Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BRAND_DARK);
        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_DARK);

        document.add(new Paragraph("MASTERY ACADEMY", brandFont));
        document.add(new Paragraph(table.title(), titleFont));
        document.add(new Paragraph(table.subtitle(), metaFont));
        document.add(new Paragraph("Generado por " + generatedBy + " el " + LocalDateTime.now().format(DATE_FMT)
                + "  ·  Registros: " + table.rows().size(), metaFont));
        document.add(new Paragraph(" "));

        PdfPTable pdfTable = new PdfPTable(table.headers().size());
        pdfTable.setWidthPercentage(100);
        pdfTable.setWidths(columnWidths(table));
        pdfTable.setHeaderRows(1);

        for (String header : table.headers()) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(BRAND_DARK);
            cell.setPadding(6);
            pdfTable.addCell(cell);
        }

        boolean striped = false;
        for (List<Object> row : table.rows()) {
            for (Object value : row) {
                PdfPCell cell = new PdfPCell(new Phrase(format(value), cellFont));
                cell.setPadding(5);
                if (value instanceof Number) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                if (striped) cell.setBackgroundColor(new Color(245, 245, 245));
                pdfTable.addCell(cell);
            }
            striped = !striped;
        }

        if (table.footer() != null) {
            for (Object value : table.footer()) {
                PdfPCell cell = new PdfPCell(new Phrase(format(value), footerFont));
                cell.setPadding(6);
                cell.setBackgroundColor(new Color(250, 240, 205));
                if (value instanceof Number) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                pdfTable.addCell(cell);
            }
        }

        document.add(pdfTable);
        document.close();
        return out.toByteArray();
    }

    /** Ancho relativo de cada columna según el texto más largo (acotado para que ninguna domine). */
    private float[] columnWidths(ReportTable table) {
        float[] widths = new float[table.headers().size()];
        for (int i = 0; i < widths.length; i++) {
            int max = table.headers().get(i).length();
            for (List<Object> row : table.rows()) {
                max = Math.max(max, format(row.get(i)).length());
            }
            widths[i] = Math.min(Math.max(max, 4), 40);
        }
        return widths;
    }

    // ----------------------------------------------------------------- XLSX
    private byte[] toXlsx(ReportTable table, String generatedBy) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Reporte");
            int cols = table.headers().size();

            XSSFFont titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
            CellStyle intStyle = workbook.createCellStyle();
            intStyle.setDataFormat(workbook.createDataFormat().getFormat("0"));
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.createDataFormat().getFormat("dd/mm/yyyy hh:mm"));

            XSSFFont boldFont = workbook.createFont();
            boldFont.setBold(true);
            CellStyle footerStyle = workbook.createCellStyle();
            footerStyle.setFont(boldFont);
            footerStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            footerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            footerStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Mastery Academy - " + table.title());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, Math.max(cols - 1, 0)));
            sheet.createRow(1).createCell(0).setCellValue(table.subtitle());
            sheet.createRow(2).createCell(0).setCellValue("Generado por " + generatedBy + " el " + LocalDateTime.now().format(DATE_FMT));

            int rowIdx = 4;
            Row headerRow = sheet.createRow(rowIdx++);
            for (int i = 0; i < cols; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(table.headers().get(i));
                cell.setCellStyle(headerStyle);
            }

            for (List<Object> row : table.rows()) {
                Row r = sheet.createRow(rowIdx++);
                for (int i = 0; i < row.size(); i++) {
                    writeCell(r.createCell(i), row.get(i), numberStyle, intStyle, dateStyle);
                }
            }

            if (table.footer() != null) {
                Row r = sheet.createRow(rowIdx);
                for (int i = 0; i < table.footer().size(); i++) {
                    Cell cell = r.createCell(i);
                    Object value = table.footer().get(i);
                    if (value instanceof Number n) cell.setCellValue(n.doubleValue());
                    else cell.setCellValue(format(value));
                    cell.setCellStyle(footerStyle);
                }
            }

            sheet.createFreezePane(0, 5);
            sheet.setAutoFilter(new CellRangeAddress(4, 4, 0, Math.max(cols - 1, 0)));
            for (int i = 0; i < cols; i++) {
                try {
                    sheet.autoSizeColumn(i);
                } catch (RuntimeException | Error noFonts) {
                    sheet.setColumnWidth(i, 20 * 256); // entorno sin fuentes AWT: ancho fijo
                }
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el archivo Excel", e);
        }
    }

    private void writeCell(Cell cell, Object value, CellStyle numberStyle, CellStyle intStyle, CellStyle dateStyle) {
        if (value == null) {
            cell.setBlank();
        } else if (value instanceof Integer || value instanceof Long) {
            cell.setCellValue(((Number) value).doubleValue());
            cell.setCellStyle(intStyle);
        } else if (value instanceof Number n) {
            cell.setCellValue(n.doubleValue());
            cell.setCellStyle(numberStyle);
        } else if (value instanceof LocalDateTime dt) {
            cell.setCellValue(dt);
            cell.setCellStyle(dateStyle);
        } else {
            cell.setCellValue(value.toString());
        }
    }

    // ------------------------------------------------------------------ CSV
    private byte[] toCsv(ReportTable table) {
        StringBuilder sb = new StringBuilder("﻿"); // BOM para que Excel detecte UTF-8 (tildes, ñ)
        appendCsvLine(sb, table.headers().stream().map(h -> (Object) h).toList());
        for (List<Object> row : table.rows()) {
            appendCsvLine(sb, row);
        }
        if (table.footer() != null) {
            appendCsvLine(sb, table.footer());
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void appendCsvLine(StringBuilder sb, List<Object> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(',');
            Object v = values.get(i);
            String text = v instanceof Double d ? String.format(java.util.Locale.US, "%.2f", d) : format(v);
            if (text.contains(",") || text.contains("\"") || text.contains("\n")) {
                text = "\"" + text.replace("\"", "\"\"") + "\"";
            }
            sb.append(text);
        }
        sb.append("\r\n");
    }

    private String format(Object value) {
        if (value == null) return "";
        if (value instanceof LocalDateTime dt) return dt.format(DATE_FMT);
        if (value instanceof Double d) return String.format(java.util.Locale.US, "%,.2f", d);
        return value.toString();
    }
}
