import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CourseService } from '../services/course.service';
import { CategoryService } from '../services/category.service';
import { NewsService } from '../services/news.service';
import { AuthService } from '../services/auth.service';
import { Course } from '../models/course.model';
import { Category } from '../models/category.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Cinematic Luxury Logo Pre-loader -->
    <div *ngIf="showPreloader" class="preloader-overlay" [class.fade-out]="preloaderFadeOut">
      <div class="preloader-content">
        <div class="preloader-logo-wrapper">
          <img src="/assets/logo.jpeg" alt="Mastery Logo" class="preloader-logo">
          <div class="preloader-glow"></div>
        </div>
        <div class="preloader-progress-bar">
          <div class="preloader-progress-fill"></div>
        </div>
        <span class="preloader-status">INICIANDO TEMPLO...</span>
      </div>
    </div>

    <div *ngIf="showPortalGate" class="portal-gate" (mousemove)="onMouseMove($event)">
      <!-- Custom Cinematic Gold Cursor -->
      <div class="custom-cursor" [class.cursor-hovering]="cursorHovered" [ngStyle]="cursorStyles">
        <div class="cursor-inner"></div>
      </div>

      <button class="portal-sound-toggle" (click)="toggleAmbientSound($event)"
              (mouseenter)="cursorHovered = true" (mouseleave)="cursorHovered = false"
              [title]="ambientMuted ? 'Encender Música' : 'Apagar Música'">
        <span class="sound-icon">{{ ambientMuted ? '🔇' : '🔊' }}</span>
      </button>

      <div class="portal-content">
        <!-- Floating Orbital Logo Centerpiece -->
        <div class="portal-logo-container" (mouseenter)="cursorHovered = true" (mouseleave)="cursorHovered = false">
          <img src="/assets/logo.jpeg" alt="Mastery Logo" class="portal-logo-img">
          <div class="portal-logo-ring"></div>
        </div>

        <div class="portal-header">
          <span class="portal-badge">EL SANTUARIO</span>
          <h1 class="portal-title">MASTERY ACADEMY</h1>
          <p class="portal-tagline">El Templo de la Consistencia Financiera y el Trading de Élite</p>
        </div>
        
        <div class="portal-action">
          <button class="portal-btn" (click)="enterAcademy()"
                  (mouseenter)="cursorHovered = true" (mouseleave)="cursorHovered = false">
            <span class="btn-ripple"></span>
            <span class="btn-ripple-2"></span>
            <span class="btn-text">INGRESAR AL TEMPLO</span>
          </button>
        </div>
      </div>
    </div>

    <div class="live-ticker-wrap">
      <div class="live-ticker">
        <div class="ticker-item"><span class="t-name">BTC/USD</span> <span class="t-val success">$64,231.50 (+2.4%)</span></div>
        <div class="ticker-item"><span class="t-name">ETH/USD</span> <span class="t-val success">$3,450.12 (+1.8%)</span></div>
        <div class="ticker-item"><span class="t-name">GOLD</span> <span class="t-val danger">$2,341.20 (-0.4%)</span></div>
        <div class="ticker-item"><span class="t-name">EUR/USD</span> <span class="t-val success">1.0845 (+0.12%)</span></div>
        <div class="ticker-item"><span class="t-name">NASDAQ</span> <span class="t-val success">18,231.40 (+1.1%)</span></div>
        <div class="ticker-item"><span class="t-name">OIL</span> <span class="t-val danger">$82.15 (-1.2%)</span></div>
        <div class="ticker-item"><span class="t-name">BTC/USD</span> <span class="t-val success">$64,231.50 (+2.4%)</span></div>
        <div class="ticker-item"><span class="t-name">ETH/USD</span> <span class="t-val success">$3,450.12 (+1.8%)</span></div>
      </div>
    </div>

    <main class="hero-section">
      <div class="hero-content">
        <div class="trading-badge">MASTERY TERMINAL ACTIVE</div>
        <h1 class="gradient-text hero-title">La Academia de los <br> Traders de Élite</h1>
        <p class="hero-subtitle">Accede a formación institucional, señales en tiempo real y mentorías personalizadas. No juegues al azar, opera con ventaja.</p>
        
        <div class="search-container premium-card">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="¿Qué mercado quieres dominar hoy?" 
              [(ngModel)]="searchQuery"
              (input)="onSearch()">
          </div>
          
          <div class="filter-group">
            <span class="filter-label">MERCADOS</span>
            <div class="category-filters">
              <button 
                [class.active]="selectedCategoryId === undefined"
                (click)="selectCategory(undefined)">
                Todos
              </button>
              <button 
                *ngFor="let cat of categories" 
                [class.active]="selectedCategoryId === cat.id"
                (click)="selectCategory(cat.id)">
                {{ cat.name }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label">NIVEL DE RIESGO / EXPERIENCIA</span>
            <div class="category-filters level-filters">
              <button [class.active]="selectedLevel === 'All'" (click)="selectLevel('All')">Todos</button>
              <button [class.active]="selectedLevel === 'BEGINNER'" (click)="selectLevel('BEGINNER')">Principiante</button>
              <button [class.active]="selectedLevel === 'INTERMEDIATE'" (click)="selectLevel('INTERMEDIATE')">Intermedio</button>
              <button [class.active]="selectedLevel === 'ADVANCED'" (click)="selectLevel('ADVANCED')">Avanzado</button>
            </div>
          </div>
        </div>

        <div id="courses-section" class="courses-grid">
          <div class="premium-card course-card fade-in" *ngFor="let course of courses.slice(0, visibleCourses)">
            <div class="course-image">
              <img [src]="'/assets/' + getSimpleName(course.imageUrl)" [alt]="course.title">
              <div class="course-badge" *ngIf="course.level">{{ course.level }}</div>
              <div class="admin-actions" *ngIf="authService.isAdmin() || authService.isInstructor()">
                <button class="action-btn edit" (click)="onEdit(course)">✏️</button>
                <button class="action-btn delete" (click)="onDelete(course.id)">🗑️</button>
              </div>
            </div>
            <div class="course-info">
              <div class="course-meta">
                <span class="category">{{ course.category?.name || 'Trading' }}</span>
                <span class="duration">{{ course.duration || 0 }}h</span>
              </div>
              <h3>{{ course.title }}</h3>
              <p>{{ course.description }}</p>
              
              <div class="instructor-mini-profile" *ngIf="course.instructor">
                <img [src]="course.instructor.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'" class="instructor-avatar-mini">
                <div class="instructor-details-mini">
                  <span class="instructor-label">{{ course.instructor.specialty || 'MENTORÍA POR' }}</span>
                  <span class="instructor-name">{{ course.instructor.fullName || course.instructor.username }}</span>
                </div>
                <div class="verify-badge-mini" title="Mentor Verificado">✓</div>
              </div>
              <div class="course-footer">
                <div class="price-container">
                  <span class="price-label">Acceso VIP</span>
                  <span class="price">\${{ course.price }}</span>
                </div>
                <button *ngIf="!authService.isAdmin()" class="btn-premium btn-sm" [disabled]="isEnrolled(course.id)" (click)="enroll(course)">
                  {{ isEnrolled(course.id) ? 'Adquirido' : 'Empezar Ahora' }}
                </button>
                <span *ngIf="authService.isAdmin()" style="font-size: 0.7rem; color: var(--primary-gold); border: 1px solid var(--primary-gold); background: var(--primary-gold-low); padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 800; letter-spacing: 0.5px;" class="admin-badge-vip">MODERADOR VIP</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-area" *ngIf="courses.length > visibleCourses">
          <button class="btn-premium btn-ghost" (click)="loadMore()">
            <span>Explorar más programas</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"></path></svg>
          </button>
        </div>

        <section class="features-section">
          <div class="feature-card premium-card">
            <div class="f-icon-wrap">
              <img src="/assets/f1.png" alt="Live Signals">
            </div>
            <h4>Señales en Vivo</h4>
            <p>Alertas institucionales filtradas por nuestros expertos.</p>
          </div>
          <div class="feature-card premium-card">
            <div class="f-icon-wrap">
              <img src="/assets/f2.png" alt="Risk Management">
            </div>
            <h4>Gestión de Riesgo</h4>
            <p>Aprende a proteger tu capital como el 1% de arriba.</p>
          </div>
          <div class="feature-card premium-card">
            <div class="f-icon-wrap">
              <img src="/assets/f3.png" alt="Data Analysis">
            </div>
            <h4>Análisis de Datos</h4>
            <p>Herramientas propietarias para tu toma de decisiones.</p>
          </div>
        </section>

        <section class="news-section">
          <div class="section-header">
            <span class="badge">MARKET INTELLIGENCE</span>
            <h2>Terminal Intelligence</h2>
            <p>Últimos movimientos del mercado analizados por nuestro equipo de IA.</p>
          </div>
          <div class="news-grid">
            <div class="news-card premium-card" *ngFor="let item of newsItems">
              <div class="news-image-wrap" *ngIf="item.imageUrl">
                <img [src]="item.imageUrl" [alt]="item.title">
              </div>
              <div class="news-tag" [class]="item.sentiment">{{ item.tag }}</div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.content }}</p>
              <div class="news-footer">
                <span class="time">Hace {{ item.time }}</span>
                <span class="read-more">Ver Reporte →</span>
              </div>
            </div>
          </div>
        </section>

        <div class="empty-results premium-card fade-in" *ngIf="courses.length === 0">
          <div class="empty-icon">🔭</div>
          <h3>No hemos encontrado cursos para esta búsqueda</h3>
          <p>Intenta ajustar tus filtros o busca algo menos específico para seguir aprendiendo.</p>
          <button class="btn-premium btn-sm mt-4" (click)="resetFilters()">Reiniciar Filtros</button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .hero-section { padding: 4rem 0 8rem; position: relative; }
    .hero-content { text-align: center; }
    
    .live-ticker-wrap {
      width: 100%;
      background: rgba(0,0,0,0.4);
      border-bottom: 1px solid var(--border-glass);
      overflow: hidden;
      white-space: nowrap;
      padding: 0.5rem 0;
    }
    .live-ticker {
      display: inline-block;
      animation: ticker-scroll 30s linear infinite;
    }
    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-right: 3rem;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .t-name { color: var(--text-muted); }
    .t-val.success { color: var(--success-green); }
    .t-val.danger { color: var(--danger-red); }
    @keyframes ticker-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .trading-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: var(--primary-gold-low);
      color: var(--primary-gold);
      border: 1px solid var(--primary-gold);
      border-radius: 50px;
      font-weight: 800;
      font-size: 0.7rem;
      letter-spacing: 2px;
      margin-bottom: 1.5rem;
    }

    .hero-title { 
      font-size: 3.2rem; 
      margin-bottom: 1.25rem; 
      line-height: 1.1; 
      letter-spacing: -1.5px;
      font-weight: 800;
    }
    .hero-subtitle { 
      font-size: 1.1rem; 
      color: var(--text-muted); 
      max-width: 600px; 
      margin: 0 auto 3.5rem; 
      line-height: 1.6;
    }

    .search-container {
      max-width: 750px;
      margin: 0 auto 6rem;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255,255,255,0.03);
      padding: 0.6rem 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--border-glass);
      transition: 0.3s;
    }
    .search-box:focus-within { border-color: var(--primary-gold); background: rgba(251, 191, 36, 0.03); }
    .search-box input { background: none; border: none; color: white; width: 100%; font-size: 0.95rem; }
    .search-box input:focus { outline: none; }
    .search-icon { opacity: 0.5; font-size: 0.9rem; }

    .filter-group { display: flex; flex-direction: column; gap: 0.75rem; text-align: left; padding: 0 0.5rem; }
    .filter-label { font-size: 0.65rem; color: var(--primary-gold); font-weight: 800; letter-spacing: 2px; opacity: 0.7; }
    .category-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-start; }
    .category-filters button {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-glass);
      color: var(--text-muted);
      padding: 0.4rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.75rem;
      transition: all 0.3s;
    }
    .category-filters button:hover { border-color: var(--text-muted); color: white; }
    .category-filters button.active { background: var(--primary-gold); color: #000; border-color: var(--primary-gold); box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2); }

    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
    .course-card { height: 100%; display: flex; flex-direction: column; overflow: hidden; padding: 0; }
    .course-image { position: relative; height: 200px; }
    .course-image img { width: 100%; height: 100%; object-fit: cover; }
    .course-badge { position: absolute; top: 1rem; left: 1rem; background: var(--bg-deep); padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid var(--primary-gold); }
    .admin-actions { position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; }
    .action-btn { background: var(--bg-deep); border: 1px solid var(--border-glass); color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    .course-info { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; }
    .course-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--primary-gold); font-weight: 800; margin-bottom: 0.75rem; }
    .course-info h3 { margin-bottom: 0.75rem; font-size: 1.25rem; text-align: left; }
    .course-info p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; flex-grow: 1; text-align: left; }

    .instructor-mini-profile { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .instructor-avatar-mini { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--primary-gold); object-fit: cover; }
    .instructor-details-mini { display: flex; flex-direction: column; text-align: left; }
    .instructor-label { font-size: 0.6rem; color: var(--primary-gold); font-weight: 800; letter-spacing: 1px; }
    .instructor-name { font-size: 0.85rem; color: white; font-weight: 700; }
    .verify-badge-mini { background: var(--primary-gold); color: black; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.5rem; font-weight: 900; margin-left: auto; border: 1px solid #000; }

    .course-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 1.25rem; }
    .price-container { display: flex; flex-direction: column; text-align: left; }
    .price-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .price { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }

    .pagination-area { margin-top: 4rem; display: flex; justify-content: center; }
    .features-section {
      margin-top: 10rem;
      margin-bottom: 6rem;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2.5rem;
      
      width: 100vw;
      position: relative;
      left: 50%;
      right: 50%;
      margin-left: -50vw;
      margin-right: -50vw;
      padding: 8rem 12vw;
      
      background: 
        linear-gradient(rgba(5, 5, 5, 0.8), rgba(5, 5, 5, 0.8)), 
        url('/assets/fondo2.jpeg') no-repeat center center fixed;
      background-size: cover;
      
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 30px 60px rgba(0,0,0,0.95), inset 0 -30px 60px rgba(0,0,0,0.95);
    }
    
    .feature-card {
      padding: 3.5rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.015) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 24px !important;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    
    .feature-card:hover {
      background: rgba(251, 191, 36, 0.04) !important;
      border-color: rgba(251, 191, 36, 0.4) !important;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(251, 191, 36, 0.1);
      transform: translateY(-12px);
    }
    .f-icon-wrap { width: 80px; height: 80px; margin-bottom: 2rem; position: relative; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .feature-card:hover .f-icon-wrap { transform: scale(1.15) rotate(5deg); }
    .f-icon-wrap img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.3)); }
    .feature-card h4 { font-size: 1.35rem; margin-bottom: 1rem; color: white; font-weight: 800; }
    .feature-card p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; }

    .news-section { margin-top: 10rem; margin-bottom: 5rem; }
    .section-header { text-align: center; margin-bottom: 4rem; }
    .section-header h2 { font-size: 2.5rem; margin: 1rem 0; font-weight: 800; }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .news-card { padding: 2rem; text-align: left; position: relative; border-left: 4px solid var(--border-glass); transition: 0.3s; overflow: hidden; }
    .news-image-wrap { height: 160px; margin: -2rem -2rem 1.5rem -2rem; overflow: hidden; }
    .news-image-wrap img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
    .news-card:hover .news-image-wrap img { transform: scale(1.1); }
    .news-card:hover { border-left-color: var(--primary-gold); background: rgba(255,255,255,0.03); }
    .news-tag { font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 4px; display: inline-block; margin-bottom: 1rem; letter-spacing: 1px; }
    .news-tag.bullish { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .news-tag.bearish { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .news-tag.volatile { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .news-card h3 { font-size: 1.1rem; margin-bottom: 0.75rem; color: white; }
    .news-card p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
    .news-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; }
    .news-footer .time { color: var(--text-muted); opacity: 0.6; }
    .news-footer .read-more { color: var(--primary-gold); font-weight: 700; cursor: pointer; }

    .hero-section::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 600px; height: 300px;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, rgba(0,0,0,0) 70%);
      z-index: -1;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .features-section { grid-template-columns: 1fr; }
    }

    /* PORTAL GATE AWWWARDS-STYLE */
    .portal-gate {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      background: radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.95) 100%), 
                  url('../../assets/portal_bg.png') no-repeat center center;
      background-size: cover;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      text-align: center;
      transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: center center;
      overflow: hidden;
      cursor: none !important;
    }

    .portal-gate * {
      cursor: none !important;
    }

    .portal-gate.fade-out-zoom {
      opacity: 0;
      transform: scale(1.2);
      pointer-events: none;
    }

    /* CUSTOM CINEMATIC GOLD CURSOR FOLLOWER */
    .custom-cursor {
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 100001;
      border: 1px solid rgba(251, 191, 36, 0.4);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                  height 0.3s cubic-bezier(0.16, 1, 0.3, 1), 
                  background-color 0.3s ease, 
                  border-color 0.3s ease;
      transform-origin: center center;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.1);
    }

    .cursor-inner {
      width: 8px;
      height: 8px;
      background: var(--primary-gold);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
      transition: all 0.3s ease;
    }

    .custom-cursor.cursor-hovering {
      border-color: var(--primary-gold);
      background: rgba(251, 191, 36, 0.08);
      box-shadow: 0 0 25px rgba(251, 191, 36, 0.25);
    }

    .custom-cursor.cursor-hovering .cursor-inner {
      width: 12px;
      height: 12px;
      box-shadow: 0 0 15px rgba(251, 191, 36, 1);
    }

    .portal-content {
      max-width: 800px;
      padding: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      animation: portalFadeIn 1.5s ease-out forwards;
    }

    /* PORTAL LOGO CENTERPIECE */
    .portal-logo-container {
      position: relative;
      width: 140px;
      height: 140px;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: logoFloat 4s ease-in-out infinite;
      z-index: 10;
    }

    .portal-logo-img {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(251, 191, 36, 0.45);
      box-shadow: 0 0 35px rgba(251, 191, 36, 0.4);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 2;
    }

    .portal-logo-ring {
      position: absolute;
      top: 5px;
      left: 5px;
      width: 130px;
      height: 130px;
      border-radius: 50%;
      border: 1px dashed rgba(251, 191, 36, 0.5);
      animation: spinRing 25s linear infinite;
      z-index: 1;
      pointer-events: none;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.1);
    }

    .portal-logo-container:hover .portal-logo-img {
      transform: scale(1.08);
      border-color: var(--primary-gold);
      box-shadow: 0 0 50px rgba(251, 191, 36, 0.85);
    }

    .portal-logo-container:hover .portal-logo-ring {
      border-color: var(--primary-gold);
      border-style: solid;
      transform: scale(1.1);
    }

    @keyframes logoFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes spinRing {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .portal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .portal-badge {
      font-size: 0.8rem;
      letter-spacing: 4px;
      color: var(--primary-gold);
      font-weight: 800;
      text-transform: uppercase;
      opacity: 0.8;
      animation: pulseGold 2s infinite ease-in-out;
    }

    .portal-title {
      font-family: 'Cinzel', 'Playfair Display', serif;
      font-size: 4rem;
      font-weight: 900;
      letter-spacing: 8px;
      background: linear-gradient(135deg, #ffffff 30%, #fcd34d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
      margin: 0.5rem 0;
    }

    .portal-tagline {
      font-size: 1.1rem;
      letter-spacing: 2px;
      color: var(--text-muted);
      max-width: 500px;
      line-height: 1.6;
    }

    /* PULSING GOLDEN BUTTON */
    .portal-action {
      position: relative;
      margin-top: 1rem;
    }

    .portal-btn {
      position: relative;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(251, 191, 36, 0.3);
      padding: 1.5rem 3.5rem;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 3px;
      color: white;
      border-radius: 50px;
      cursor: pointer;
      overflow: visible;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 
                  0 0 20px rgba(251, 191, 36, 0.1);
      backdrop-filter: blur(10px);
    }

    .portal-btn:hover {
      background: rgba(251, 191, 36, 0.1);
      border-color: var(--primary-gold);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 
                  0 0 35px rgba(251, 191, 36, 0.35);
      transform: translateY(-2px);
    }

    .portal-btn:active {
      transform: translateY(1px);
    }

    .btn-ripple, .btn-ripple-2 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      border-radius: 50px;
      border: 1px solid rgba(251, 191, 36, 0.4);
      pointer-events: none;
      animation: ripple 3s infinite cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-ripple-2 {
      animation-delay: 1.5s;
    }

    @keyframes ripple {
      0% {
        width: 100%;
        height: 100%;
        opacity: 0.8;
      }
      100% {
        width: 130%;
        height: 160%;
        opacity: 0;
      }
    }

    @keyframes portalFadeIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulseGold {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    .portal-sound-toggle {
      position: absolute;
      top: 2rem;
      right: 2rem;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(251, 191, 36, 0.3);
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      cursor: pointer;
      z-index: 100000;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .portal-sound-toggle:hover {
      background: rgba(251, 191, 36, 0.15);
      border-color: var(--primary-gold);
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(251,191,36,0.2);
    }

    .portal-sound-toggle:active {
      transform: translateY(0);
    }

    .sound-icon {
      font-size: 1.2rem;
      display: inline-block;
      transition: transform 0.2s ease;
    }

    .portal-sound-toggle:hover .sound-icon {
      transform: scale(1.1);
    }

    /* CINEMATIC PRELOADER STYLES */
    .preloader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #050505;
      z-index: 1000000;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 1s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.8s ease;
    }

    .preloader-overlay.fade-out {
      transform: translateY(-100vh);
      opacity: 0;
      pointer-events: none;
    }

    .preloader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .preloader-logo-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .preloader-logo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(251, 191, 36, 0.4);
      z-index: 2;
      animation: preloaderPulse 2s ease-in-out infinite;
    }

    .preloader-glow {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0) 70%);
      filter: blur(8px);
      z-index: 1;
      animation: preloaderGlowPulse 2s ease-in-out infinite;
    }

    .preloader-progress-bar {
      width: 200px;
      height: 2px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }

    .preloader-progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, transparent, var(--primary-gold), transparent);
      animation: preloaderFill 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
    }

    .preloader-status {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 4px;
      color: var(--primary-gold);
      opacity: 0.7;
      text-transform: uppercase;
      animation: preloaderTextFade 1.5s infinite ease-in-out;
    }

    @keyframes preloaderPulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 30px rgba(251, 191, 36, 0.2);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 50px rgba(251, 191, 36, 0.5);
      }
    }

    @keyframes preloaderGlowPulse {
      0%, 100% {
        transform: scale(0.9);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    @keyframes preloaderFill {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes preloaderTextFade {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.9; }
    }
  `]
})
export class HomeComponent implements OnInit {
  static portalEntered = false;
  static preloaderShown = false;
  courses: Course[] = [];
  enrolledIds: number[] = [];
  showPortalGate = false;

  // Cinematic Preloader states
  showPreloader = true;
  preloaderFadeOut = false;

  ambientAudio: any;
  ambientMuted = false;

  // Cinematic Cursor Follower Coordinates & Springs
  mouseX = -100;
  mouseY = -100;
  cursorX = -100;
  cursorY = -100;
  cursorScaleX = 1;
  cursorScaleY = 1;
  cursorRotation = 0;
  cursorHovered = false;
  cursorStyles: any = {};
  private cursorAnimationId?: number;
  
  searchQuery: string = '';
  selectedCategoryId?: number;
  selectedLevel: string = 'All';
  selectedInstructorId?: number;
  categories: Category[] = [];
  visibleCourses: number = 6;
  
  private searchSubject = new Subject<string>();

  newsItems: any[] = [];

  constructor(
    private courseService: CourseService,
    private categoryService: CategoryService,
    private newsService: NewsService,
    private route: ActivatedRoute,
    public authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadCourses();
    });
  }

  loadNews(): void {
    this.newsService.getAllNews().subscribe({
      next: (data) => {
        this.newsItems = data.map(item => ({
          ...item,
          time: this.formatTime(item.createdAt)
        }));
        this.cd.detectChanges();
      }
    });
  }

  formatTime(dateStr: any): string {
    if (!dateStr) return 'Reciente';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  }

  getSimpleName(url: string | undefined): string {
    if (!url) return 't1.png';
    if (url.includes('t1')) return 't1.png';
    if (url.includes('t2')) return 't2.png';
    if (url.includes('t3')) return 't3.png';
    const parts = url.split('/');
    return parts[parts.length - 1] || 't1.png';
  }

  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  startCursorLoop() {
    const loop = () => {
      // Smooth linear interpolation (spring trail)
      const dx = this.mouseX - this.cursorX;
      const dy = this.mouseY - this.cursorY;
      
      this.cursorX += dx * 0.12;
      this.cursorY += dy * 0.12;
      
      // Jelly stretch based on mouse velocity
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetScaleX = Math.min(1 + distance * 0.006, 1.6);
      const targetScaleY = Math.max(1 - distance * 0.004, 0.6);
      
      this.cursorScaleX += (targetScaleX - this.cursorScaleX) * 0.2;
      this.cursorScaleY += (targetScaleY - this.cursorScaleY) * 0.2;
      
      // Calculate rotation to match mouse heading
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.cursorRotation = angle;
      
      const size = this.cursorHovered ? 70 : 36;
      
      this.cursorStyles = {
        'left': `${this.cursorX - size/2}px`,
        'top': `${this.cursorY - size/2}px`,
        'width': `${size}px`,
        'height': `${size}px`,
        'transform': `rotate(${this.cursorRotation}deg) scale(${this.cursorScaleX}, ${this.cursorScaleY})`
      };
      
      this.cd.detectChanges();
      
      if (this.showPortalGate) {
        this.cursorAnimationId = requestAnimationFrame(loop);
      }
    };
    
    this.cursorAnimationId = requestAnimationFrame(loop);
  }

  toggleAmbientSound(event: Event) {
    if (event) event.stopPropagation();
    this.ambientMuted = !this.ambientMuted;
    if (!this.ambientMuted) {
      this.startAmbientSound();
    } else {
      this.stopAmbientSound();
    }
  }

  startAmbientSound() {
    try {
      if (!this.ambientAudio) {
        this.ambientAudio = new Audio('/assets/portal_music.mp3');
        this.ambientAudio.loop = true;
      }
      this.ambientAudio.volume = 0.25;
      this.ambientAudio.play().catch((err: any) => {
        console.warn("Audio play failed/blocked:", err);
      });
    } catch (e) {
      console.warn("Could not start ambient music:", e);
    }
  }

  stopAmbientSound() {
    if (this.ambientAudio) {
      try {
        this.ambientAudio.pause();
      } catch (e) {}
    }
  }

  fadeAmbientSound() {
    if (this.ambientAudio) {
      try {
        let fadeInterval = setInterval(() => {
          if (this.ambientAudio.volume > 0.02) {
            this.ambientAudio.volume -= 0.02;
          } else {
            clearInterval(fadeInterval);
            this.ambientAudio.pause();
          }
        }, 80);
      } catch (e) {}
    }
  }

  playPortalSound() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.8);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.2);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain1);
      gain1.gain.setValueAtTime(0.7, ctx.currentTime);
      gain1.connect(filter);

      osc2.connect(gain2);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.connect(filter);

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    } catch (e) {
      console.warn("Audio Context not allowed or blocked:", e);
    }
  }

  enterAcademy() {
    this.playPortalSound();
    const gate = document.querySelector('.portal-gate');
    if (gate) {
      gate.classList.add('fade-out-zoom');
      this.fadeAmbientSound();
      setTimeout(() => {
        this.showPortalGate = false;
        HomeComponent.portalEntered = true;
        document.body.style.overflow = 'auto';
        this.cd.detectChanges();
      }, 1200);
    }
  }

  ngOnInit(): void {
    // If the user is logged in, we NEVER block them with the portal gate!
    if (this.authService.isLoggedIn()) {
      this.showPortalGate = false;
      document.body.style.overflow = 'auto';
    } else {
      this.showPortalGate = !HomeComponent.portalEntered;
      if (this.showPortalGate) {
        document.body.style.overflow = 'hidden';

        // Initialize audio and configure soft autoplay bypass
        if (!this.ambientAudio) {
          this.ambientAudio = new Audio('/assets/portal_music.mp3');
          this.ambientAudio.loop = true;
          this.ambientAudio.volume = 0.25;
        }

        if (!this.ambientMuted) {
          this.ambientAudio.play().catch(() => {
            // Autoplay blocked! We start on the first click anywhere on the page
            const startOnInteraction = () => {
              if (!this.ambientMuted && this.showPortalGate) {
                this.ambientAudio.play().catch(() => {});
              }
              document.removeEventListener('click', startOnInteraction);
            };
            document.addEventListener('click', startOnInteraction);
          });
        }

        // Start spring cursor loop
        this.startCursorLoop();
      }
    }

    this.loadCategories();
    this.loadNews();
    this.route.queryParams.subscribe(params => {
      if (params['instructorId']) {
        this.selectedInstructorId = +params['instructorId'];
      } else {
        this.selectedInstructorId = undefined;
      }
      
      if (params['categoryId']) {
        this.selectedCategoryId = +params['categoryId'];
      } else {
        this.selectedCategoryId = undefined;
      }
      
      this.loadCourses();

      if (params['instructorId'] || params['categoryId']) {
        setTimeout(() => {
          const el = document.getElementById('courses-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 400);
      }
    });
    if (this.authService.isLoggedIn()) {
      this.loadEnrolledCourses();
    }

    // Premium cinematic preloader trigger
    if (HomeComponent.preloaderShown) {
      this.showPreloader = false;
    } else {
      HomeComponent.preloaderShown = true;
      setTimeout(() => {
        this.preloaderFadeOut = true;
        this.cd.detectChanges();
        setTimeout(() => {
          this.showPreloader = false;
          this.cd.detectChanges();
        }, 800);
      }, 1800);
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.cd.detectChanges();
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  selectCategory(categoryId?: number): void {
    this.selectedCategoryId = categoryId;
    this.loadCourses();
  }

  selectLevel(level: string): void {
    this.selectedLevel = level;
    this.loadCourses();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategoryId = undefined;
    this.selectedLevel = 'All';
    this.selectedInstructorId = undefined;
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getCourses(this.searchQuery, this.selectedCategoryId, this.selectedLevel, this.selectedInstructorId).subscribe({
      next: (data) => {
        this.courses = data;
        this.courses.forEach((c, index) => {
          if (!c.imageUrl) {
            c.imageUrl = `assets/course-${(index % 3) + 1}.webp`;
          }
        });
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error cargando cursos', err)
    });
  }

  loadEnrolledCourses(): void {
    this.courseService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.enrolledIds = Array.from(courses).map(c => c.id!).filter(id => id !== undefined);
        this.cd.detectChanges();
      }
    });
  }

  isEnrolled(courseId?: number): boolean {
    return courseId ? this.enrolledIds.includes(courseId) : false;
  }

  enroll(course: Course): void {
    if (!this.authService.isLoggedIn()) {
      // Usar el router oficial para llevarlo al login
      (window as any).appComponent.router.navigate(['/login']);
      return;
    }
    (window as any).appComponent.openCheckout(course);
  }

  loadMore(): void {
    this.visibleCourses += 6;
    this.cd.detectChanges();
  }

  onEdit(course: Course) {
    (window as any).appComponent.openEditModal(course);
  }

  onDelete(id?: number) {
    (window as any).appComponent.deleteCourse(id);
  }
}
