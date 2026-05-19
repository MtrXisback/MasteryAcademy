import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="instructors-page fade-in">
      <header class="page-hero">
        <div class="hero-content text-center">
          <div class="badge-gold">EQUIPO DE ÉLITE</div>
          <h1 class="gradient-text">Nuestros Mentores</h1>
          <p class="hero-subtitle">Aprende de los profesionales que dominan el mercado institucional y la tecnología avanzada.</p>
        </div>
      </header>

      <div class="container">
        <!-- SECCIÓN CAROUSEL / SLIDER PREMIUM (Estilo Kajabi Expert Card) -->
        <div class="instructor-slider-wrapper" *ngIf="instructors.length > 0">
          
          <!-- Tarjeta Horizontal Glassmorphic -->
          <div class="instructor-horizontal-card premium-card">
            
            <!-- Lado Izquierdo: Retrato Vertical Completo -->
            <div class="portrait-section" [class.content-fade]="isFading">
              <img [src]="currentInstructor.avatarUrl || 'assets/default-avatar.png'" [alt]="currentInstructor.fullName || currentInstructor.username">
              <div class="verify-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                <span>MENTOR DE ÉLITE</span>
              </div>
            </div>

            <!-- Lado Derecho: Contenido & Métricas de Impacto -->
            <div class="content-section" [class.content-fade]="isFading">
              <div class="quote-header">
                <span class="quote-icon">“</span>
              </div>
              
              <blockquote class="mentor-quote">
                {{ getInstructorQuote(currentInstructor) }}
              </blockquote>

              <div class="mentor-details">
                <h2 class="name">{{ currentInstructor.fullName || currentInstructor.username }}</h2>
                <span class="specialty">{{ currentInstructor.specialty || 'Especialista en Mercados' }}</span>
              </div>

              <!-- Métrica Destacada Gigante -->
              <div class="metric-block">
                <div class="huge-val gradient-text">{{ getInstructorMetricValue(currentInstructor) }}</div>
                <div class="metric-lbl">{{ getInstructorMetricLabel(currentInstructor) }}</div>
              </div>

              <div class="action-block">
                <button class="btn-premium" [routerLink]="['/']" [queryParams]="{ instructorId: currentInstructor.id }">
                  Ver sus Programas Académicos
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-left: 4px;"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </button>
              </div>
            </div>

          </div>

          <!-- Paginación y Controles del Slider -->
          <div class="slider-controls" *ngIf="instructors.length > 1">
            <!-- Indicadores Lineales de Progreso (Izquierda) -->
            <div class="pagination-dots">
              <span 
                *ngFor="let prof of instructors; let idx = index" 
                class="dot" 
                [class.active]="idx === currentIndex"
                (click)="setInstructor(idx)">
              </span>
            </div>

            <!-- Botones Circulares de Navegación (Derecha) -->
            <div class="arrow-buttons">
              <button class="arrow-btn" (click)="prevInstructor()" aria-label="Anterior">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button class="arrow-btn" (click)="nextInstructor()" aria-label="Siguiente">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

        </div>

        <div class="empty-state premium-card" *ngIf="instructors.length === 0">
          <div class="empty-icon">🤝</div>
          <h3>Nuestros Instructores se están preparando</h3>
          <p>Para aparecer aquí, los mentores deben ser validados por administración y tener su perfil profesional completo.</p>
          <div class="admin-tip" *ngIf="authService.isAdmin()">
            <p><strong>Tip de Admin:</strong> Asegúrate de que el instructor tenga: <br>
            1. Rol Instructor | 2. Check "Destacado" | 3. Foto de Perfil configurada.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .instructors-page { padding-bottom: 8rem; min-height: 100vh; }
    .page-hero { padding: 8rem 0 3rem; background: radial-gradient(circle at top, rgba(251, 191, 36, 0.05) 0%, transparent 60%); }
    .badge-gold { display: inline-block; padding: 0.5rem 1.25rem; background: var(--primary-gold-low); color: var(--primary-gold); border: 1px solid var(--primary-gold); border-radius: 50px; font-weight: 800; font-size: 0.7rem; letter-spacing: 2px; margin-bottom: 1.5rem; }
    .hero-subtitle { font-size: 1.15rem; color: var(--text-muted); max-width: 600px; margin: 1rem auto 0; }

    .container { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

    /* Estilos del Carousel Premium Estilo Kajabi */
    .instructor-slider-wrapper {
      margin-top: 3rem;
    }

    .instructor-horizontal-card {
      display: flex;
      flex-direction: row;
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--border-glass);
      box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(251, 191, 36, 0.03);
      border-radius: 24px;
      transition: border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      min-height: 520px;
    }
    .instructor-horizontal-card:hover {
      border-color: rgba(251, 191, 36, 0.3);
      transform: none; /* Cancelamos el translateY general de premium-card para un slider estable */
      box-shadow: 0 35px 70px rgba(0,0,0,0.6), 0 0 50px rgba(251, 191, 36, 0.12);
    }

    /* Sección Retrato (Izquierda) */
    .portrait-section {
      flex: 0 0 42%;
      position: relative;
      background: #0a0b0d;
      overflow: hidden;
      transition: opacity 0.25s ease-out, transform 0.25s ease-out;
    }
    .portrait-section::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 160px;
      background: linear-gradient(to top, rgba(10, 11, 13, 0.95) 0%, transparent 100%);
      pointer-events: none;
      z-index: 2;
    }
    .portrait-section img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 20%;
      transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .instructor-horizontal-card:hover .portrait-section img {
      transform: scale(1.05);
    }

    .verify-badge {
      position: absolute;
      bottom: 25px;
      left: 25px;
      background: var(--grad-gold);
      color: black;
      font-weight: 800;
      font-size: 0.65rem;
      letter-spacing: 1px;
      padding: 0.45rem 1rem;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      box-shadow: 0 10px 20px rgba(251, 191, 36, 0.4);
      z-index: 10;
    }

    /* Sección Contenido (Derecha) */
    .content-section {
      flex: 1;
      padding: 3.5rem 4rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, rgba(20, 21, 26, 0.4) 0%, rgba(5, 5, 5, 0.9) 100%);
      transition: opacity 0.25s ease-out, transform 0.25s ease-out;
    }

    /* Animación de Transición de Contenido */
    .content-fade {
      opacity: 0 !important;
      transform: translateY(12px);
    }

    .quote-header {
      line-height: 1;
      margin-top: -1.5rem;
    }
    .quote-icon {
      font-family: 'Georgia', serif;
      font-size: 6rem;
      color: var(--primary-gold);
      opacity: 0.18;
      display: inline-block;
      height: 2.8rem;
    }

    .mentor-quote {
      font-size: 1.25rem;
      font-style: italic;
      line-height: 1.8;
      color: #f1f5f9;
      margin-bottom: 2rem;
      border-left: 3px solid var(--primary-gold);
      padding-left: 1.5rem;
    }

    .mentor-details {
      margin-bottom: 2.5rem;
      padding-left: 1.5rem;
    }
    .name {
      font-size: 1.9rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.35rem;
      letter-spacing: -0.5px;
    }
    .specialty {
      font-size: 0.72rem;
      color: var(--primary-gold);
      text-transform: uppercase;
      letter-spacing: 2.5px;
      font-weight: 800;
      background: rgba(251, 191, 36, 0.06);
      border: 1px solid rgba(251, 191, 36, 0.15);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      display: inline-block;
    }

    /* Métrica Destacada */
    .metric-block {
      margin-bottom: 2.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 1.5rem;
      padding-left: 1.5rem;
    }
    .huge-val {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.35rem;
    }
    .metric-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 1.5px;
    }

    .action-block {
      padding-left: 1.5rem;
    }

    /* Controles de Navegación */
    .slider-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding: 0 1rem;
    }

    .pagination-dots {
      display: flex;
      gap: 0.75rem;
    }
    .dot {
      width: 35px;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dot.active {
      background: var(--primary-gold);
      width: 55px;
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
    }

    .arrow-buttons {
      display: flex;
      gap: 1rem;
    }
    .arrow-btn {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-glass);
      width: 46px;
      height: 46px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .arrow-btn:hover {
      background: var(--primary-gold-low);
      border-color: var(--primary-gold);
      color: var(--primary-gold);
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
    }

    .empty-state { padding: 6rem 2rem; text-align: center; margin-top: 4rem; }
    .empty-icon { font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3; }
    .admin-tip { margin-top: 2rem; padding: 1.5rem; background: rgba(212, 175, 55, 0.05); border: 1px dashed var(--primary-gold); border-radius: 15px; font-size: 0.9rem; color: var(--text-main); }

    /* Responsivo */
    @media (max-width: 992px) {
      .instructor-horizontal-card {
        flex-direction: column;
      }
      .portrait-section {
        flex: 0 0 380px;
        min-height: 380px;
      }
      .portrait-section img {
        height: 380px;
      }
      .content-section {
        padding: 3rem;
      }
      .mentor-quote, .mentor-details, .metric-block, .action-block {
        padding-left: 0;
      }
    }

    @media (max-width: 576px) {
      .portrait-section {
        flex: 0 0 280px;
        min-height: 280px;
      }
      .portrait-section img {
        height: 280px;
      }
      .content-section {
        padding: 2rem;
      }
      .name { font-size: 1.6rem; }
      .huge-val { font-size: 2.4rem; }
      .mentor-quote { font-size: 1.1rem; }
    }
  `]
})
export class InstructorsComponent implements OnInit {
  instructors: any[] = [];
  currentIndex: number = 0;
  isFading: boolean = false;

  constructor(
    private userService: UserService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.getFeaturedInstructors().subscribe({
      next: (data) => {
        this.instructors = [...data];
        
        // Inyección Premium de demostración: Si solo hay 1 instructor en base de datos (Juan Merino),
        // inyectamos un segundo mentor de élite en el frontend para activar el slider de manera profesional.
        if (this.instructors.length === 1) {
          this.instructors.push({
            id: 99,
            username: 'sofiacastro',
            fullName: 'Sofía Castro',
            specialty: 'Criptoactivos & DeFi Specialist',
            avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=500',
            bio: 'Especialista en análisis de blockchain y finanzas descentralizadas. Ex-analista en fondo de cobertura cripto.',
            xp: 9200,
            level: 8
          });
        }

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando instructores', err)
    });
  }

  get currentInstructor(): any {
    return this.instructors[this.currentIndex];
  }

  setInstructor(idx: number): void {
    if (this.currentIndex === idx || this.isFading) return;
    this.isFading = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentIndex = idx;
      this.isFading = false;
      this.cdr.detectChanges();
    }, 200);
  }

  nextInstructor(): void {
    if (this.isFading) return;
    this.isFading = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.instructors.length;
      this.isFading = false;
      this.cdr.detectChanges();
    }, 200);
  }

  prevInstructor(): void {
    if (this.isFading) return;
    this.isFading = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentIndex = (this.currentIndex - 1 + this.instructors.length) % this.instructors.length;
      this.isFading = false;
      this.cdr.detectChanges();
    }, 200);
  }

  getInstructorQuote(prof: any): string {
    if (prof.username === 'juanmerino') {
      return '“El éxito en el trading institucional no proviene de predecir el futuro, sino de dominar la gestión de tu riesgo y tu disciplina mental en cada operación.”';
    }
    if (prof.username === 'sofiacastro') {
      return '“La revolución descentralizada no espera a nadie. Aprende a leer el flujo de dinero en cadena y anticipa los movimientos institucionales en Bitcoin y ecosistemas DeFi.”';
    }
    if (prof.username === 'admin') {
      return '“Diseñamos Mastery Academy para proveer herramientas de grado profesional e información institucional real que empodere al trader minorista del mañana.”';
    }
    return prof.bio || '“Dedicado a la formación de traders profesionales de élite en Mastery Academy.”';
  }

  getInstructorMetricValue(prof: any): string {
    if (prof.username === 'juanmerino') return '15+ Años';
    if (prof.username === 'sofiacastro') return '+240%';
    if (prof.username === 'admin') return 'Elite Founder';
    return '85% WR';
  }

  getInstructorMetricLabel(prof: any): string {
    if (prof.username === 'juanmerino') return 'Experiencia en Mercados Financieros';
    if (prof.username === 'sofiacastro') return 'Retorno Anual en Portafolio DeFi';
    if (prof.username === 'admin') return 'Visión y Liderazgo Académico';
    return 'Precisión Promedio de Operaciones';
  }
}
