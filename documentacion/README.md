# Documentación del proyecto – Mastery Academy (EFSRT V · Grupo 05)

| Entregable | Archivo |
|---|---|
| Informe del proyecto (editable) | `Informe_Proyecto_EFSRT_Grupo05_MasteryAcademy.docx` |
| Informe del proyecto (PDF de referencia) | `Informe_Proyecto_EFSRT_Grupo05_MasteryAcademy.pdf` |
| Guía de instalación y configuración | `Guia_de_Instalacion_MasteryAcademy.docx` |
| Manual de operación técnica + inventario de datos | `Manual_de_Operacion_Tecnica_MasteryAcademy.docx` |
| Diagramas UML, arquitectura, Gantt, organigrama, pipeline CI | `diagramas/*.puml` (fuente PlantUML) y `diagramas/*.png` |
| Capturas de la aplicación | `capturas/` |
| Gráficos del análisis SEPTE | `graficos/` |

Componentes relacionados en el repositorio:

- Código fuente: `backend/` (Spring Boot) y `frontend/` (Angular)
- Pruebas: `backend/src/test/` (JUnit) y `pruebas/rendimiento/` (k6)
- Datos de demostración: `pruebas/datos-demo.sql`
- Integración continua: `.github/workflows/ci.yml`

Para regenerar los diagramas:

```bash
docker run --rm -v "$PWD/diagramas:/data" plantuml/plantuml:1.2024.7 -tpng -Sdpi=150 -charset UTF-8 /data/*.puml
```
