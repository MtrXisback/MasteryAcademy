import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService, News } from '../services/news.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container fade-in">
      <div class="admin-header">
        <div>
          <span class="badge">ADMIN TERMINAL</span>
          <h1>Gestión de Inteligencia de Mercado</h1>
          <p>Publica actualizaciones en tiempo real para todos los alumnos.</p>
        </div>
        <button class="btn-premium btn-sm" (click)="showForm = !showForm">
          {{ showForm ? 'Cancelar' : 'Nueva Noticia' }}
        </button>
      </div>

      <!-- Formulario -->
      <div class="premium-card form-card" *ngIf="showForm">
        <h3>{{ editingNews ? 'Editar Noticia' : 'Crear Nueva Noticia' }}</h3>
        <form (ngSubmit)="saveNews()" class="news-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Título de la Noticia</label>
              <input type="text" [(ngModel)]="newsForm.title" name="title" required placeholder="Ej: FED mantiene tasas...">
            </div>
            <div class="form-group">
              <label>Tag / Categoría</label>
              <select [(ngModel)]="newsForm.tag" name="tag">
                <option value="MACRO">MACRO</option>
                <option value="CRYPTO">CRYPTO</option>
                <option value="FOREX">FOREX</option>
                <option value="ACCIONES">ACCIONES</option>
              </select>
              <div class="form-group">
              <label>Imagen de Impacto (URL)</label>
              <input type="text" [(ngModel)]="newsForm.imageUrl" name="imageUrl" placeholder="Ej: https://.../grafico.png">
            </div>
          </div>
            <div class="form-group">
              <label>Sentimiento del Mercado</label>
              <select [(ngModel)]="newsForm.sentiment" name="sentiment">
                <option value="bullish">Bullish (Alcista)</option>
                <option value="bearish">Bearish (Bajista)</option>
                <option value="volatile">Volátil</option>
              </select>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Contenido / Análisis</label>
            <textarea [(ngModel)]="newsForm.content" name="content" rows="4" required placeholder="Escribe el análisis detallado aquí..."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-premium btn-sm">Guardar Noticia</button>
          </div>
        </form>
      </div>

      <!-- Tabla de Noticias -->
      <div class="premium-card table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Título</th>
              <th>Tag</th>
              <th>Sentimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let n of newsList">
              <td class="date-cell">{{ n.createdAt | date:'short' }}</td>
              <td class="title-cell">{{ n.title }}</td>
              <td><span class="tag-badge">{{ n.tag }}</span></td>
              <td>
                <span class="sentiment-badge" [class]="n.sentiment">{{ n.sentiment }}</span>
              </td>
              <td class="actions-cell">
                <button class="icon-btn edit" (click)="editNews(n)">✏️</button>
                <button class="icon-btn delete" (click)="deleteNews(n.id!)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    .admin-header h1 { font-size: 2rem; color: white; margin: 0.5rem 0; }
    .admin-header p { color: var(--text-muted); font-size: 0.9rem; }

    .form-card { margin-bottom: 3rem; padding: 2rem; border-left: 4px solid var(--primary-gold); }
    .news-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.75rem; color: var(--primary-gold); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .form-group input, .form-group select, .form-group textarea {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-glass);
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      appearance: none;
    }
    .form-group select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }
    .form-group select option {
      background: #1a1a1a;
      color: white;
      padding: 10px;
    }
    .form-group input:focus, .form-group select:focus { border-color: var(--primary-gold); outline: none; }
    .form-actions { display: flex; justify-content: flex-end; }

    .table-card { padding: 0; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
    .admin-table th { padding: 1.25rem; background: rgba(255,255,255,0.02); color: var(--primary-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
    .admin-table td { padding: 1.25rem; border-bottom: 1px solid var(--border-glass); color: white; font-size: 0.9rem; }
    .date-cell { color: var(--text-muted); font-size: 0.8rem; }
    .title-cell { font-weight: 600; }
    .tag-badge { background: rgba(255,255,255,0.05); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
    
    .sentiment-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .sentiment-badge.bullish { color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .sentiment-badge.bearish { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .sentiment-badge.volatile { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }

    .actions-cell { display: flex; gap: 0.5rem; }
    .icon-btn { background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; }
    .icon-btn:hover { background: rgba(255,255,255,0.1); border-color: white; }
  `]
})
export class NewsManagementComponent implements OnInit {
  newsList: News[] = [];
  showForm = false;
  editingNews: News | null = null;
  newsForm: News = { title: '', content: '', tag: 'MACRO', sentiment: 'bullish', imageUrl: '' };

  constructor(
    private newsService: NewsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(): void {
    this.newsService.getAllNews().subscribe(data => {
      this.newsList = data;
      this.cd.detectChanges();
    });
  }

  editNews(news: News): void {
    this.editingNews = news;
    this.newsForm = { ...news };
    this.showForm = true;
  }

  deleteNews(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta noticia?')) {
      this.newsService.deleteNews(id).subscribe(() => this.loadNews());
    }
  }

  saveNews(): void {
    if (this.editingNews) {
      this.newsService.updateNews(this.editingNews.id!, this.newsForm).subscribe(() => {
        this.resetForm();
        this.loadNews();
      });
    } else {
      this.newsService.createNews(this.newsForm).subscribe(() => {
        this.resetForm();
        this.loadNews();
      });
    }
  }

  resetForm(): void {
    this.showForm = false;
    this.editingNews = null;
    this.newsForm = { title: '', content: '', tag: 'MACRO', sentiment: 'bullish', imageUrl: '' };
  }
}
