import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="static-page fade-in">
      <header class="static-hero">
        <div class="hero-content">
          <div class="page-badge">{{ pageTitle.toUpperCase() }}</div>
          <h1 class="gradient-text">{{ pageHeroTitle }}</h1>
          <p>{{ pageHeroSubtitle }}</p>
        </div>
      </header>

      <div class="content-container premium-card">
        <!-- SOBRE NOSOTROS -->
        <div *ngIf="pageType === 'about'" class="content-section">
          <h2>Nuestra Misión Institucional</h2>
          <p>En Mastery Trading Academy, no solo enseñamos trading; formamos a la próxima generación de analistas institucionales. Nuestra misión es democratizar el conocimiento de élite que antes estaba reservado solo para los grandes bancos.</p>
          
          <div class="values-grid">
            <div class="value-item">
              <span class="value-icon">🛡️</span>
              <h3>Transparencia</h3>
              <p>Operamos con total honestidad en nuestras estrategias y resultados.</p>
            </div>
            <div class="value-item">
              <span class="value-icon">📈</span>
              <h3>Excelencia</h3>
              <p>Nuestros programas son validados por expertos con años en el mercado real.</p>
            </div>
            <div class="value-item">
              <span class="value-icon">🤝</span>
              <h3>Comunidad</h3>
              <p>Unimos a traders de todo el mundo bajo un estándar de calidad común.</p>
            </div>
          </div>
        </div>

        <!-- CENTRO DE AYUDA -->
        <div *ngIf="pageType === 'help'" class="content-section">
          <h2>Preguntas Frecuentes</h2>
          <div class="faq-list">
            <div class="faq-item">
              <h3>¿Necesito experiencia previa?</h3>
              <p>No. Tenemos programas desde el nivel "Principiante" hasta "Avanzado" (Análisis Institucional).</p>
            </div>
            <div class="faq-item">
              <h3>¿Recibo un certificado?</h3>
              <p>Sí, todos nuestros programas incluyen un certificado de excelencia al completar las lecciones y cuestionarios.</p>
            </div>
            <div class="faq-item">
              <h3>¿Cómo accedo a los cursos adquiridos?</h3>
              <p>Una vez completado el pago, el curso aparecerá inmediatamente en tu "Panel" personal.</p>
            </div>
          </div>
        </div>

        <!-- INVERSIÓN RESPONSABLE -->
        <div *ngIf="pageType === 'investment'" class="content-section">
          <h2>Gestión de Capital Sostenible</h2>
          <p>En Mastery Academy abogamos firmemente por una cultura de inversión responsable. El trading no es un juego de azar, sino una profesión de gestión matemática del riesgo.</p>
          <div class="faq-list">
            <div class="faq-item">
              <h3>Regla del 1%: Preservación</h3>
              <p>Nunca arriesgues más del 1% de tu cuenta en una sola operación. La preservación del capital es el primer pilar de la consistencia.</p>
            </div>
            <div class="faq-item">
              <h3>Apalancamiento Inteligente</h3>
              <p>Utiliza el apalancamiento como una herramienta de eficiencia de margen, no para sobreexponer tu cuenta. Formamos gestores, no apostadores.</p>
            </div>
          </div>
        </div>

        <!-- TRABAJA CON NOSOTROS -->
        <div *ngIf="pageType === 'careers'" class="content-section">
          <h2>Únete a la Élite Financiera</h2>
          <p>Buscamos instructores experimentados, analistas de mercado cualificados y desarrolladores cuantitativos que quieran liderar la revolución educativa en finanzas.</p>
          <div class="values-grid">
            <div class="value-item">
              <span class="value-icon">👨‍🏫</span>
              <h3>Mentores</h3>
              <p>Traders con track record auditado para guiar a nuestra comunidad.</p>
            </div>
            <div class="value-item">
              <span class="value-icon">💻</span>
              <h3>Tech & Quant</h3>
              <p>Desarrolladores para construir herramientas de análisis propietarias.</p>
            </div>
            <div class="value-item">
              <span class="value-icon">📈</span>
              <h3>Research</h3>
              <p>Analistas macroeconómicos para alimentar nuestra Terminal Intelligence.</p>
            </div>
          </div>
        </div>

        <!-- LEGAL SYSTEM (PRIVACIDAD / TÉRMINOS / COOKIES / LEGAL) -->
        <div *ngIf="pageType === 'privacy' || pageType === 'terms' || pageType === 'cookies' || pageType === 'legal'" class="content-section">
          <h2>Protección, Cumplimiento y Transparencia</h2>
          <p>Garantizamos el cumplimiento normativo internacional y la protección absoluta de toda la información manejada en la plataforma.</p>
          
          <div *ngIf="pageType === 'privacy'" class="legal-text">
            <p>1. **Privacidad absoluta**: Tus datos personales están encriptados de extremo a extremo.</p>
            <p>2. **Cero venta de datos**: Mastery Academy jamás comercializará tu información con terceros.</p>
            <p>3. **Seguridad SSL**: Cifrado bancario de grado militar para la protección de sesiones activas.</p>
          </div>
          
          <div *ngIf="pageType === 'terms'" class="legal-text">
            <p>1. **Uso de Licencia**: El acceso VIP te concede una licencia personal e intransferible.</p>
            <p>2. **Advertencia de Riesgo**: El trading conlleva riesgo de pérdida de capital; opera con responsabilidad.</p>
            <p>3. **Garantías de Acceso**: Soporte técnico 24/7 y acceso de por vida a los cursos adquiridos.</p>
          </div>
          
          <div *ngIf="pageType === 'cookies'" class="legal-text">
            <p>1. **Cookies esenciales**: Usadas únicamente para mantener tu sesión segura y activa.</p>
            <p>2. **Optimización**: Cookies analíticas para medir el rendimiento de la terminal de trading virtual.</p>
            <p>3. **Preferencias**: Guardamos tu selección de modo oscuro y tus filtros preferidos localmente.</p>
          </div>
          
          <div *ngIf="pageType === 'legal'" class="legal-text">
            <p>1. **Entidad Reguladora**: Mastery Academy opera bajo el marco regulatorio del sector e-learning.</p>
            <p>2. **Exención de Responsabilidad**: El material es meramente educativo y no constituye asesoría financiera directa.</p>
            <p>3. **Derechos Reservados**: Todo el software, logos y contenidos están registrados legalmente.</p>
          </div>
        </div>

        <div class="page-footer-actions">
          <button routerLink="/" class="btn-premium btn-ghost">Regresar al Inicio</button>
          <button routerLink="/dashboard" class="btn-premium">Ir a mi Panel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .static-page { padding-bottom: 5rem; }
    .static-hero { 
      padding: 6rem 0; background: radial-gradient(circle at top, rgba(212, 175, 55, 0.1) 0%, transparent 70%); 
      text-align: center; margin-bottom: -3rem;
    }
    .hero-content { max-width: 800px; margin: 0 auto; }
    .page-badge { font-size: 0.7rem; font-weight: 800; letter-spacing: 3px; color: var(--primary-gold); margin-bottom: 1rem; }
    .static-hero h1 { font-size: 3.5rem; margin-bottom: 1rem; }
    .static-hero p { color: var(--text-muted); font-size: 1.1rem; }

    .content-container { max-width: 1000px; margin: 0 auto; padding: 4rem; min-height: 500px; }
    
    .content-section h2 { font-size: 2rem; margin-bottom: 2rem; color: white; }
    .content-section p { color: var(--text-muted); line-height: 1.8; font-size: 1.1rem; margin-bottom: 2rem; }

    .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 3rem; }
    .value-item { padding: 2rem; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid var(--border-glass); text-align: center; }
    .value-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
    .value-item h3 { font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--primary-gold); }
    .value-item p { font-size: 0.9rem; margin: 0; }

    .faq-list { display: flex; flex-direction: column; gap: 2rem; }
    .faq-item { padding-bottom: 2rem; border-bottom: 1px solid var(--border-glass); }
    .faq-item:last-child { border: none; }
    .faq-item h3 { color: var(--primary-gold); margin-bottom: 0.75rem; font-size: 1.2rem; }

    .legal-text { background: rgba(0,0,0,0.2); padding: 2rem; border-radius: 12px; font-family: monospace; font-size: 0.9rem; margin-top: 1.5rem; }
    .legal-text p { margin-bottom: 1rem; line-height: 1.6; }
    .legal-text p:last-child { margin-bottom: 0; }

    .page-footer-actions { margin-top: 5rem; display: flex; justify-content: center; gap: 1.5rem; border-top: 1px solid var(--border-glass); padding-top: 3rem; }

    @media (max-width: 768px) {
      .values-grid { grid-template-columns: 1fr; }
      .content-container { padding: 2rem; }
      .static-hero h1 { font-size: 2.5rem; }
    }
  `]
})
export class StaticPageComponent implements OnInit {
  pageType: string = 'about';
  pageTitle: string = 'Institucional';
  pageHeroTitle: string = 'Nuestra Identidad';
  pageHeroSubtitle: string = 'Descubre por qué somos la academia líder en trading de élite.';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.pageType = params['type'];
      this.setupPage();
    });
  }

  setupPage(): void {
    switch (this.pageType) {
      case 'about':
        this.pageTitle = 'Institucional';
        this.pageHeroTitle = 'Sobre Mastery Academy';
        this.pageHeroSubtitle = 'Liderando la formación de traders de élite desde 2026.';
        break;
      case 'help':
        this.pageTitle = 'Soporte';
        this.pageHeroTitle = 'Centro de Ayuda';
        this.pageHeroSubtitle = 'Todo lo que necesitas saber para comenzar tu camino.';
        break;
      case 'investment':
        this.pageTitle = 'Academia';
        this.pageHeroTitle = 'Inversión Responsable';
        this.pageHeroSubtitle = 'La gestión de riesgos y la sostenibilidad de tu capital es nuestra prioridad.';
        break;
      case 'careers':
        this.pageTitle = 'Academia';
        this.pageHeroTitle = 'Trabaja con Nosotros';
        this.pageHeroSubtitle = 'Forma parte del equipo docente y tecnológico más brillante en finanzas.';
        break;
      case 'privacy':
        this.pageTitle = 'Legal';
        this.pageHeroTitle = 'Política de Privacidad';
        this.pageHeroSubtitle = 'Tus datos están protegidos por estándares de grado militar.';
        break;
      case 'terms':
        this.pageTitle = 'Legal';
        this.pageHeroTitle = 'Términos y Condiciones';
        this.pageHeroSubtitle = 'Transparencia y claridad en nuestra relación profesional.';
        break;
      case 'cookies':
        this.pageTitle = 'Legal';
        this.pageHeroTitle = 'Política de Cookies';
        this.pageHeroSubtitle = 'Transparencia total sobre cómo optimizamos tu experiencia terminal.';
        break;
      case 'legal':
        this.pageTitle = 'Legal';
        this.pageHeroTitle = 'Aviso Legal';
        this.pageHeroSubtitle = 'Términos de cumplimiento regulatorio y normativas financieras.';
        break;
    }
  }
}
