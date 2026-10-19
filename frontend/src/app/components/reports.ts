import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, ReportSummary, ReportType, ReportFormat } from '../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page fade-in">
      <header class="admin-header">
        <div class="container">
          <h1 class="gradient-text">Centro de Reportes</h1>
          <p class="subtitle">Indicadores del negocio y exportación de reportes en PDF, Excel y CSV.</p>
        </div>
      </header>

      <div class="container mt-5">
        <div class="kpi-grid" *ngIf="summary">
          <div class="kpi premium-card">
            <span class="kpi-label">Ingresos totales</span>
            <span class="kpi-value">{{ summary.totalRevenue | currency:'USD' }}</span>
          </div>
          <div class="kpi premium-card">
            <span class="kpi-label">Inscripciones</span>
            <span class="kpi-value">{{ summary.totalEnrollments }}</span>
          </div>
          <div class="kpi premium-card">
            <span class="kpi-label">Pagos registrados</span>
            <span class="kpi-value">{{ summary.totalPayments }}</span>
          </div>
          <div class="kpi premium-card">
            <span class="kpi-label">Estudiantes</span>
            <span class="kpi-value">{{ summary.totalStudents }}</span>
          </div>
          <div class="kpi premium-card">
            <span class="kpi-label">Cursos</span>
            <span class="kpi-value">{{ summary.totalCourses }}</span>
          </div>
        </div>

        <div class="charts-grid" *ngIf="summary">
          <div class="premium-card chart-card">
            <h3>Ingresos de los últimos 6 meses (USD)</h3>
            <div class="bar-chart">
              <div class="bar-col" *ngFor="let m of summary.revenueByMonth">
                <span class="bar-value">{{ m.revenue | number:'1.0-0' }}</span>
                <div class="bar" [style.height.%]="pct(m.revenue, maxRevenue)" [title]="m.month + ': ' + (m.revenue | currency:'USD')"></div>
                <span class="bar-label">{{ monthLabel(m.month) }}</span>
              </div>
            </div>
          </div>

          <div class="premium-card chart-card">
            <h3>Cursos con más inscritos</h3>
            <div class="hbar-list">
              <div class="hbar-row" *ngFor="let c of summary.topCourses">
                <div class="hbar-head">
                  <span class="hbar-title">{{ c.title }}</span>
                  <span class="hbar-num">{{ c.enrolled }}</span>
                </div>
                <div class="hbar-track"><div class="hbar-fill" [style.width.%]="pct(c.enrolled, maxEnrolled)"></div></div>
              </div>
              <p class="empty" *ngIf="!summary.topCourses.length">Aún no hay cursos registrados.</p>
            </div>
          </div>
        </div>

        <div class="premium-card export-card">
          <h3>Exportar reporte</h3>
          <div class="export-form">
            <label>
              <span>Tipo de reporte</span>
              <select [(ngModel)]="type">
                <option value="ventas">Ventas (pagos)</option>
                <option value="inscripciones">Inscripciones por curso</option>
                <option value="estudiantes">Estudiantes</option>
              </select>
            </label>
            <label *ngIf="type === 'ventas'">
              <span>Desde</span>
              <input type="date" [(ngModel)]="from">
            </label>
            <label *ngIf="type === 'ventas'">
              <span>Hasta</span>
              <input type="date" [(ngModel)]="to">
            </label>
          </div>
          <div class="export-actions">
            <button class="btn-premium btn-sm" [disabled]="downloading" (click)="download('pdf')">📄 PDF</button>
            <button class="btn-premium btn-ghost btn-sm" [disabled]="downloading" (click)="download('xlsx')">📊 Excel</button>
            <button class="btn-premium btn-ghost btn-sm" [disabled]="downloading" (click)="download('csv')">🧾 CSV</button>
          </div>
          <p class="error" *ngIf="error">{{ error }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page { padding-bottom: 5rem; }
    .admin-header { padding: 4rem 0; background: linear-gradient(to bottom, rgba(212, 175, 55, 0.05), transparent); }
    .subtitle { color: var(--text-muted); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    h3 { color: var(--text-main); font-size: 1rem; margin-bottom: 1.5rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .kpi { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.5rem; }
    .kpi-label { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-value { color: var(--primary-gold); font-size: 1.75rem; font-weight: 800; font-variant-numeric: tabular-nums; }

    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-card { padding: 1.5rem; }
    .bar-chart { display: flex; align-items: flex-end; gap: 1rem; height: 220px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 0.4rem; }
    .bar { width: 100%; max-width: 48px; min-height: 2px; background: var(--grad-gold); border-radius: 6px 6px 0 0; transition: height 0.6s ease; }
    .bar-value { font-size: 0.7rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .bar-label { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }

    .hbar-list { display: flex; flex-direction: column; gap: 1rem; }
    .hbar-head { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.35rem; font-size: 0.85rem; }
    .hbar-title { color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hbar-num { color: var(--primary-gold); font-weight: 700; font-variant-numeric: tabular-nums; }
    .hbar-track { height: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; }
    .hbar-fill { height: 100%; background: var(--grad-gold); border-radius: 8px; transition: width 0.6s ease; }
    .empty { color: var(--text-muted); font-size: 0.85rem; }

    .export-card { padding: 1.5rem; }
    .export-form { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .export-form label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .export-form select, .export-form input { background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.7rem 1rem; color: white; min-width: 200px; color-scheme: dark; }
    .export-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .error { color: var(--danger-red); margin-top: 1rem; font-size: 0.85rem; }
  `]
})
export class ReportsComponent implements OnInit {
  summary?: ReportSummary;
  type: ReportType = 'ventas';
  from = '';
  to = '';
  downloading = false;
  error = '';
  maxRevenue = 0;
  maxEnrolled = 0;

  private readonly months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.reportService.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.maxRevenue = Math.max(0, ...data.revenueByMonth.map(m => m.revenue));
        this.maxEnrolled = Math.max(0, ...data.topCourses.map(c => c.enrolled));
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo cargar el resumen. Verifica que tu cuenta sea administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  pct(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  monthLabel(ym: string): string {
    const [year, month] = ym.split('-');
    return `${this.months[Number(month) - 1]} ${year.slice(2)}`;
  }

  download(format: ReportFormat): void {
    this.downloading = true;
    this.error = '';
    this.reportService.download(this.type, format, this.from || undefined, this.to || undefined).subscribe({
      next: res => {
        const disposition = res.headers.get('Content-Disposition') || '';
        const match = /filename="?([^";]+)"?/.exec(disposition);
        const filename = match ? match[1] : `reporte-${this.type}.${format}`;
        const url = URL.createObjectURL(res.body!);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo generar el reporte.';
        this.downloading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
