import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../services/course.service';
import { CategoryService } from '../services/category.service';
import { Course } from '../models/course.model';
import { Category } from '../models/category.model';
import { AssessmentService, Certificate } from '../services/assessment.service';
import { CertificateModalComponent } from './certificate-modal';
import { ChatService } from '../services/chat.service';
import { User } from '../models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CertificateModalComponent],
  template: `
    <div class="dashboard-container">
      <header class="db-header">
        <h1 class="gradient-text">Mastery Dashboard</h1>
        <p class="db-welcome">Sesión de trading activa: <span class="username">{{ (authService.currentUser$ | async)?.username }}</span></p>
      </header>

      <div class="db-grid">
        <!-- STATS ADMIN / INSTRUCTOR -->
        <ng-container *ngIf="authService.isAdmin() || authService.isInstructor()">
          <div class="stat-card premium-card">
            <div class="label">Alumnos de Élite</div>
            <div class="value-row">
              <div class="value">{{ stats.studentCount || 0 | number }}</div>
            </div>
            <div class="trend gold">Registrados</div>
          </div>
          <div class="stat-card premium-card">
            <div class="label">Revenue de Gestión</div>
            <div class="value-row">
              <div class="value">{{ stats.totalRevenue || 0 | currency:'USD' }}</div>
            </div>
            <div class="trend gold">Acumulado</div>
          </div>
          <div class="stat-card premium-card">
            <div class="label">Programas Activos</div>
            <div class="value-row">
              <div class="value">{{ stats.courseCount || 0 }}</div>
            </div>
            <div class="trend gold">En Crecimiento</div>
          </div>
        </ng-container>

        <!-- RANGO DE MAESTRÍA (ESTUDIANTE) -->
        <div class="stat-card premium-card gamification-card" *ngIf="authService.isStudent()">
          <div class="gami-header">
            <div class="label">Rango de Maestría</div>
            <div class="rank-badge">{{ getRankTitle((authService.currentUser$ | async)?.level || 1) }}</div>
          </div>
          <div class="rank-details">
            <div class="value">Lvl {{ (authService.currentUser$ | async)?.level || 1 }}</div>
            <div class="xp-text">{{ (authService.currentUser$ | async)?.xp || 0 }} XP</div>
          </div>
          <div class="xp-bar-container" title="Progreso al siguiente nivel">
            <div class="xp-bar-fill" [style.width.%]="getXpProgressPercentage((authService.currentUser$ | async)?.xp || 0)"></div>
          </div>
          <div class="trend gold">Faltan {{ getXpNeededForNextLevel((authService.currentUser$ | async)?.xp || 0) }} XP para Nivel {{ ((authService.currentUser$ | async)?.level || 1) + 1 }}</div>
        </div>

        <!-- STATS ESTUDIANTE -->
        <div class="stat-card premium-card clickable" *ngIf="authService.isStudent()" (click)="activeMainTab = 'messages'" [class.active-tab]="activeMainTab === 'messages'">
          <div class="label">Mensajes Pendientes</div>
          <div class="value-row">
            <div class="value">💬</div>
          </div>
          <div class="trend gold">Buzón de Mentoría</div>
        </div>
        <div class="stat-card premium-card" *ngIf="authService.isStudent()">
          <div class="label">Tus Cursos de Maestría</div>
          <div class="value-row">
            <div class="value">{{ enrolledCourses.length }}</div>
          </div>
          <div class="trend gold">Progreso Global: {{ calculateGlobalProgress() }}%</div>
        </div>
        <div class="stat-card premium-card" *ngIf="authService.isStudent()">
          <div class="label">Certificaciones Logradas</div>
          <div class="value-row">
            <div class="value">{{ certificates.length }}</div>
          </div>
          <div class="trend success">Profesional</div>
        </div>
      </div>



      <section class="db-content">
        <div class="content-box premium-card main-area">
          <div class="header-with-action">
            <div class="tab-headers">
              <h2 [class.active]="activeMainTab === 'courses'" (click)="activeMainTab = 'courses'; cd.detectChanges();">
                {{ authService.isAdmin() ? 'Moderación Global' : (authService.isStudent() ? 'Tu Formación' : 'Tus Programas') }}
              </h2>
              <h2 *ngIf="authService.isStudent()" [class.active]="activeMainTab === 'simulator'" (click)="activeMainTab = 'simulator'; cd.detectChanges();">
                Simulador de Trading
              </h2>
              <h2 *ngIf="authService.isStudent()" [class.active]="activeMainTab === 'messages'" (click)="activeMainTab = 'messages'; cd.detectChanges();">
                Mensajería
              </h2>
            </div>
            
            <button 
              *ngIf="authService.isAdmin()" 
              class="btn-premium btn-ghost btn-sm mr-2"
              routerLink="/admin/news">
              📰 Gestionar Noticias
            </button>
            <button 
              *ngIf="authService.isAdmin()" 
              class="btn-premium btn-ghost btn-sm mr-2"
              routerLink="/admin/users">
              👥 Gestionar Usuarios
            </button>
            <button 
              *ngIf="authService.isInstructor() && !authService.isAdmin()" 
              class="btn-premium btn-sm"
              (click)="showCreateModal = true">
              + Lanzar Nuevo Programa
            </button>
          </div>
          
          <!-- SECCIÓN DE CURSOS -->
          <div class="courses-section-wrapper" *ngIf="activeMainTab === 'courses'">
            <!-- Estudiantes -->
            <div class="courses-list" *ngIf="authService.isStudent()">
              <div class="enrolled-item" *ngFor="let course of enrolledCourses">
                <div class="course-mini-info">
                  <div class="title-row">
                    <h3>{{ course.title }}</h3>
                    <span class="progress-percent" *ngIf="getCourseProgress(course.id!) > 0">
                      {{ getCourseProgress(course.id!) }}% completado
                    </span>
                  </div>
                  <p class="instructor-text">Mentor: {{ course.instructor?.username || course.instructor }}</p>
                  
                  <div class="udemy-progress-bar" *ngIf="getCourseProgress(course.id!) > 0">
                    <div class="progress-fill" [style.width.%]="getCourseProgress(course.id!)"></div>
                  </div>
                </div>
                
                <button 
                  class="btn-premium btn-sm" 
                  [class.btn-ghost]="getCourseProgress(course.id!) === 100"
                  [routerLink]="['/course', course.id]">
                  {{ getCourseProgress(course.id!) === 100 ? 'REPASAR CONTENIDO' : (getCourseProgress(course.id!) === 0 ? 'INICIAR CURSO' : 'CONTINUAR ESTUDIO') }}
                </button>
              </div>
              <p class="empty-state" *ngIf="enrolledCourses.length === 0">
                Aún no has iniciado tu camino al éxito. <br>
                <a routerLink="/" class="gold-link">Explora nuestros cursos de élite</a>
              </p>
            </div>

            <!-- Instructores / Admin -->
            <div class="courses-list" *ngIf="authService.isAdmin() || authService.isInstructor()">
              <div class="enrolled-item admin-view" *ngFor="let course of allCourses">
                <div class="course-mini-info">
                  <div class="title-row-admin">
                    <h3>{{ course.title }}</h3>
                    <span class="badge-status" [class.published]="course.status === 'PUBLISHED'">
                      {{ course.status === 'PUBLISHED' ? 'EN VIVO' : 'BORRADOR' }}
                    </span>
                  </div>
                  <p class="instructor-tag" *ngIf="authService.isAdmin()">Instructor: <strong>{{ course.instructor?.username || course.instructor }}</strong></p>
                  <p class="stats-text">Capítulos: {{ course.modules?.length || 0 }} | Nivel: {{ course.level }}</p>
                </div>
                <div class="action-group">
                  <button *ngIf="authService.isAdmin()" class="btn-premium btn-ghost btn-sm btn-status" (click)="toggleCourseStatus(course)">
                    {{ course.status === 'PUBLISHED' ? 'Ocultar' : 'Publicar' }}
                  </button>
                  <button class="btn-premium btn-ghost btn-sm" [routerLink]="['/course', course.id, 'manage']">Gestionar</button>
                  <button class="btn-premium btn-sm" [routerLink]="['/course', course.id]">Previsualizar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN DE MENSAJERÍA (Solo Estudiantes) -->
          <div class="messaging-section" *ngIf="activeMainTab === 'messages' && authService.isStudent()">
            <div class="contacts-grid">
              <div class="contact-card premium-card" *ngFor="let contact of contacts" (click)="openChat(contact)">
                <div class="contact-avatar">{{ contact.username.substring(0,2).toUpperCase() }}</div>
                <div class="contact-info">
                  <span class="contact-name">{{ contact.username }}</span>
                  <span class="contact-role">@{{ contact.roles[0].replace('ROLE_', '').toLowerCase() }}</span>
                </div>
                <button class="btn-chat-action">Abrir Chat</button>
              </div>
            </div>
            <div class="empty-state" *ngIf="contacts.length === 0">
              <div class="empty-icon">📫</div>
              <p>Aún no tienes conversaciones activas. <br> Inicia una consulta desde el reproductor de un curso.</p>
            </div>
          </div>

          <!-- SECCIÓN DEL SIMULADOR DE TRADING DE ÉLITE -->
          <div class="simulator-section" *ngIf="activeMainTab === 'simulator' && authService.isStudent()">
            <div class="simulator-layout">
              <!-- Wallet & Metrics -->
              <div class="sim-wallet-card premium-card">
                <div class="wallet-stat">
                  <span class="label">Balance Virtual</span>
                  <span class="value gold-text">{{ virtualBalance | currency:'USD' }}</span>
                </div>
                <div class="wallet-stat">
                  <span class="label">Flotante (P&L)</span>
                  <span class="value pnl-value" [class.success]="floatingPnL >= 0" [class.fail]="floatingPnL < 0">
                    {{ floatingPnL >= 0 ? '+' : '' }}{{ floatingPnL | currency:'USD' }}
                  </span>
                </div>
                <div class="wallet-stat">
                  <span class="label">Patrimonio Neto</span>
                  <span class="value">{{ equity | currency:'USD' }}</span>
                </div>
              </div>

              <!-- Simulator grid: Markets and Forms -->
              <div class="simulator-grid">
                <!-- Market Feed -->
                <div class="sim-markets premium-card">
                  <h3>Cotizaciones en Vivo</h3>
                  <div class="asset-feed-list">
                    <div class="asset-feed-row" *ngFor="let asset of simulatedAssets">
                      <div class="asset-info">
                        <span class="asset-name">{{ asset.name }}</span>
                        <span class="asset-symbol">{{ asset.symbol }}</span>
                      </div>
                      <div class="asset-price-box">
                        <span class="asset-price" [class.up]="asset.direction === 'up'" [class.down]="asset.direction === 'down'">
                          {{ asset.price | number: (asset.decimals === 4 ? '1.4-4' : '1.2-2') }}
                        </span>
                        <span class="asset-change" [class.up]="asset.direction === 'up'" [class.down]="asset.direction === 'down'">
                          {{ asset.change >= 0 ? '↑' : '↓' }} {{ asset.change | number:'1.2-2' }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Form to trade -->
                <div class="sim-trade-form premium-card">
                  <h3>Nueva Operación</h3>
                  <div class="form-group">
                    <label>Activo Financiero</label>
                    <select class="form-select w-full" [(ngModel)]="selectedAssetSymbol" (change)="cd.detectChanges();">
                      <option *ngFor="let asset of simulatedAssets" [value]="asset.symbol">{{ asset.name }} ({{ asset.symbol }})</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Cantidad (Unidades)</label>
                      <input type="number" class="form-input" [(ngModel)]="tradeSize" step="0.01" min="0.01">
                    </div>
                    <div class="form-group">
                      <label>Dirección</label>
                      <select class="form-select w-full" [(ngModel)]="tradeType" (change)="cd.detectChanges();">
                        <option value="LONG">COMPRA (Long)</option>
                        <option value="SHORT">VENTA (Short)</option>
                      </select>
                    </div>
                  </div>
                  <button class="btn-premium w-full mt-4" (click)="openPosition()">
                    Ejecutar Operación de Élite ⚡
                  </button>
                </div>
              </div>

              <!-- Active Positions Table -->
              <div class="active-positions-container premium-card mt-4">
                <h3>Posiciones Abiertas</h3>
                <div class="sales-table-container">
                  <table class="premium-table">
                    <thead>
                      <tr>
                        <th>Activo</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Precio Entrada</th>
                        <th>Precio Actual</th>
                        <th>Flotante (P&L)</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let pos of activePositions">
                        <td>{{ pos.symbol }}</td>
                        <td>
                          <span class="badge-status" [class.published]="pos.type === 'LONG'" style="background: rgba(16, 185, 129, 0.15); color: var(--success-green); padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 800; font-size: 0.75rem;">
                            {{ pos.type }}
                          </span>
                        </td>
                        <td>{{ pos.size }}</td>
                        <td>{{ pos.entryPrice | number: '1.2-4' }}</td>
                        <td>{{ pos.currentPrice | number: '1.2-4' }}</td>
                        <td class="font-bold" [class.success]="pos.pnl >= 0" [class.fail]="pos.pnl < 0">
                          {{ pos.pnl >= 0 ? '+' : '' }}{{ pos.pnl | currency:'USD' }}
                        </td>
                        <td>
                          <button class="btn-premium btn-ghost btn-sm" (click)="closePosition(pos.id)">Cerrar</button>
                        </td>
                      </tr>
                      <tr *ngIf="activePositions.length === 0">
                        <td colspan="7" class="text-center" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                          No hay posiciones abiertas en este momento.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="db-sidebar">
          <div class="premium-card sidebar-widget" *ngIf="authService.isStudent()">
            <h3>Tus Certificados</h3>
            <div class="certificates-list">
              <div class="cert-item premium-card" *ngFor="let cert of certificates" (click)="viewCertificate(cert)" style="cursor: pointer;">
                <div class="cert-icon">📜</div>
                <div class="cert-details">
                  <span class="cert-title">{{ cert.course.title }}</span>
                  <span class="cert-code">{{ cert.certificateCode }}</span>
                </div>
              </div>
              <p class="empty-state-mini" *ngIf="certificates.length === 0">
                Aún no tienes certificados. ¡Completa un curso para obtener uno!
              </p>
            </div>
          </div>

          <div class="premium-card sidebar-widget" *ngIf="authService.isStudent()">
            <h3>Trading Signals</h3>
            <ul class="activity-list">
              <li *ngFor="let act of activities">
                <span class="time">{{act.time}}</span>
                <p>{{act.desc}}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal de Certificado -->
    <app-certificate-modal 
      *ngIf="showCertModal" 
      [certificate]="selectedCert" 
      (close)="showCertModal = false">
    </app-certificate-modal>

    <!-- Modal de Creación de Curso -->
    <div class="modal-overlay" *ngIf="showCreateModal">
      <div class="modal-content premium-card">
        <div class="modal-header">
          <h2 class="gradient-text">Nuevo Programa de Trading</h2>
          <button class="close-btn" (click)="showCreateModal = false">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Título del Programa</label>
            <input type="text" [(ngModel)]="newCourse.title" placeholder="Ej: Master en Futuros y Opciones">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Categoría</label>
              <select class="form-select" [(ngModel)]="newCourse.category" [compareWith]="compareCategories">
                <option [ngValue]="undefined" disabled>Seleccionar mercado...</option>
                <option *ngFor="let cat of categories" [ngValue]="cat">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nivel</label>
              <select class="form-select" [(ngModel)]="newCourse.level">
                <option value="BEGINNER">Principiante</option>
                <option value="INTERMEDIATE">Intermedio</option>
                <option value="ADVANCED">Avanzado</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Precio ($)</label>
              <input type="number" [(ngModel)]="newCourse.price" placeholder="49.99">
            </div>
            <div class="form-group">
              <label>Duración (Horas)</label>
              <input type="number" [(ngModel)]="newCourse.duration" placeholder="20.5">
            </div>
          </div>

          <div class="form-group">
            <label>Descripción del Programa</label>
            <textarea [(ngModel)]="newCourse.description" rows="3" placeholder="Describe qué aprenderán tus alumnos..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-premium btn-ghost w-full" (click)="showCreateModal = false">Cancelar</button>
          <button class="btn-premium w-full" (click)="createCourse()" [disabled]="!isFormValid()">Lanzar Programa</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem 0; animation: fadeIn 0.5s ease; }
    .header-with-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .db-header { margin-bottom: 3.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 1.5rem; }
    .username { color: var(--primary-gold); font-weight: 800; }
    
    .tab-headers { 
      display: flex; 
      gap: 2.5rem; 
      align-items: center; 
      border-bottom: 1px solid rgba(255,255,255,0.06); 
      width: 100%;
      padding-bottom: 0.75rem;
      margin-bottom: 2rem;
    }
    .tab-headers h2 { 
      cursor: pointer; 
      color: var(--text-muted); 
      transition: all 0.3s ease; 
      margin: 0; 
      font-size: 1.15rem;
      font-weight: 700;
      position: relative;
      padding-bottom: 0.75rem;
    }
    .tab-headers h2:hover {
      color: white;
    }
    .tab-headers h2.active { 
      color: white; 
    }
    .tab-headers h2.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--grad-gold);
      border-radius: 2px;
    }

    .clickable { cursor: pointer; transition: 0.3s; }
    .clickable:hover { border-color: var(--primary-gold); transform: translateY(-5px); }
    .active-tab { border-color: var(--primary-gold); background: var(--primary-gold-low); }

    .db-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); 
      gap: 2rem; 
      margin-bottom: 4rem; 
    }
    
    .stat-card { 
      padding: 1.75rem; 
      display: flex; 
      flex-direction: column; 
      justify-content: space-between; 
      min-height: 170px;
    }
    .stat-card .label { 
      font-size: 0.75rem; 
      color: var(--text-muted); 
      font-weight: 700; 
      text-transform: uppercase; 
      letter-spacing: 1.5px; 
      display: block;
      margin-bottom: 0.5rem;
    }
    .stat-card .value { 
      font-size: 2.2rem; 
      font-weight: 800; 
      color: white; 
      margin: 0.25rem 0; 
      line-height: 1.1;
      display: block;
    }
    .stat-card .value-row {
      display: flex;
      align-items: center;
      flex-grow: 1;
    }
    .trend { 
      font-size: 0.8rem; 
      font-weight: 600; 
      display: block;
      margin-top: 0.5rem;
    }
    .trend.success { color: var(--success-green); }
    .trend.gold { color: var(--primary-gold); }

    .db-content { display: grid; grid-template-columns: 1fr 360px; gap: 2.5rem; }
    .main-area { padding: 2.5rem; }
    
    .db-sidebar { display: flex; flex-direction: column; gap: 2rem; }
    .sidebar-widget { padding: 2rem; }
    .sidebar-widget h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-glass);
      padding-bottom: 0.75rem;
      margin-bottom: 1.5rem;
    }
    
    .courses-list { margin-top: 1rem; }
    .enrolled-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 1.75rem; border: 1px solid var(--border-glass); border-radius: 20px; 
      margin-bottom: 1.5rem;
      background: rgba(255,255,255,0.015);
      transition: all 0.3s ease;
    }
    .enrolled-item:hover { border-color: var(--primary-gold); background: var(--bg-card-hover); }
    
    .course-mini-info { flex-grow: 1; margin-right: 2rem; }
    .title-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
    .course-mini-info h3 { font-size: 1.2rem; margin: 0; color: white; font-weight: 800; letter-spacing: 0.25px; }
    .progress-percent { font-size: 0.75rem; color: var(--primary-gold); font-weight: 800; text-transform: uppercase; }
    .instructor-text { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }

    .udemy-progress-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-top: 0.75rem; }
    .progress-fill { height: 100%; background: var(--grad-gold); transition: width 0.5s ease; }

    .action-group { display: flex; gap: 1rem; }

    .activity-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
    .activity-list li { 
      padding: 1rem; 
      border-radius: 12px; 
      background: rgba(255,255,255,0.01); 
      border: 1px solid rgba(255,255,255,0.03); 
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transition: all 0.3s ease;
    }
    .activity-list li:hover {
      background: rgba(255,255,255,0.03);
      border-color: rgba(251, 191, 36, 0.2);
    }
    .activity-list .time { font-size: 0.7rem; color: var(--primary-gold); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .activity-list p { margin: 0; font-size: 0.85rem; color: var(--text-main); font-weight: 600; }

    .empty-state { text-align: center; padding: 3rem 0; color: var(--text-muted); line-height: 2; }
    .gold-link { color: var(--primary-gold); font-weight: 700; text-decoration: none; }

    .analytics-row { margin-bottom: 2rem; }
    .chart-box { padding: 2.25rem; }
    .chart-box h3 { font-size: 1.1rem; margin-bottom: 2rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .chart-placeholder { height: 150px; display: flex; align-items: flex-end; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-glass); }
    .bar { flex: 1; background: var(--grad-gold); border-radius: 6px 6px 0 0; transition: all 0.5s ease; position: relative; cursor: pointer; }
    .bar:hover { filter: brightness(1.3); transform: scaleX(1.05); }
    .bar::after { content: ''; position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 0.7rem; color: var(--primary-gold); font-weight: 800; opacity: 0; transition: 0.3s; }
    .bar:hover::after { opacity: 1; content: attr(style); }

    .cert-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; margin-bottom: 1rem; background: rgba(251, 191, 36, 0.04); border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.08); transition: all 0.3s; }
    .cert-item:hover { background: rgba(251, 191, 36, 0.08); border-color: rgba(251, 191, 36, 0.3); }
    .cert-icon { font-size: 1.75rem; }
    .cert-details { display: flex; flex-direction: column; gap: 0.25rem; }
    .cert-title { font-weight: 800; font-size: 0.85rem; color: white; }
    .cert-code { font-size: 0.7rem; color: var(--primary-gold); font-family: monospace; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .messaging-section { padding-top: 1rem; }
    .contacts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .contact-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; cursor: pointer; transition: 0.3s; }
    .contact-card:hover { border-color: var(--primary-gold); background: var(--bg-card-hover); }
    .contact-avatar { width: 50px; height: 50px; border-radius: 50%; background: var(--grad-gold); color: black; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; }
    .contact-info { display: flex; flex-direction: column; flex-grow: 1; }
    .contact-name { font-weight: 700; color: white; }
    .contact-role { font-size: 0.75rem; color: var(--primary-gold); text-transform: uppercase; font-weight: 700; }
    .btn-chat-action { background: none; border: 1px solid var(--border-glass); color: var(--text-muted); font-size: 0.7rem; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; }

    .premium-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .premium-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid var(--border-glass); }
    .premium-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
    .premium-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .gold-text { color: var(--primary-gold); }
    .font-bold { font-weight: 800; }

    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    @media (max-width: 992px) { .db-content { grid-template-columns: 1fr; } }

    select {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-glass);
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1rem;
    }
    select option { background: #1a1a1a; color: white; }

    /* Estilos Premium de Gamificación, Simulador de Trading y SVG Charts */
    .gamification-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .gami-header { display: flex; justify-content: space-between; align-items: center; }
    .rank-badge { background: var(--grad-gold); color: black; font-weight: 800; font-size: 0.7rem; padding: 0.25rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2); }
    .rank-details { display: flex; justify-content: space-between; align-items: baseline; margin: 0.5rem 0 0.25rem; }
    .xp-text { font-size: 0.95rem; font-weight: 700; color: var(--primary-gold); }
    .xp-bar-container { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin: 0.5rem 0; border: 1px solid rgba(255,255,255,0.02); }
    .xp-bar-fill { height: 100%; background: var(--grad-gold); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
    
    .chart-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .chart-header-row h3 { margin: 0; }
    .chart-toggles { display: flex; gap: 0.75rem; }
    .btn-chart-toggle { background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); color: var(--text-muted); padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.3s; }
    .btn-chart-toggle:hover { border-color: var(--primary-gold); color: white; }
    .btn-chart-toggle.active { background: var(--primary-gold-low); border-color: var(--primary-gold); color: var(--primary-gold); }
    .svg-chart-container { position: relative; width: 100%; height: 160px; overflow: visible; }
    .premium-svg-chart { width: 100%; height: 100%; overflow: visible; }
    .chart-dot { cursor: pointer; transition: r 0.2s ease, fill 0.2s ease; }
    .chart-dot:hover { r: 8; fill: white; }
    
    .simulator-layout { display: flex; flex-direction: column; gap: 2rem; }
    .sim-wallet-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding: 1.5rem 2rem; text-align: center; }
    .wallet-stat { display: flex; flex-direction: column; gap: 0.25rem; }
    .wallet-stat .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .wallet-stat .value { font-size: 1.8rem; font-weight: 800; color: white; }
    .pnl-value.success { color: var(--success-green); }
    .pnl-value.fail { color: var(--danger-red); }
    
    .simulator-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .sim-markets, .sim-trade-form { padding: 2rem; }
    .sim-markets h3, .sim-trade-form h3 { margin-bottom: 1.5rem; }
    .asset-feed-list { display: flex; flex-direction: column; gap: 1rem; }
    .asset-feed-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--border-glass); border-radius: 12px; background: rgba(255,255,255,0.01); }
    .asset-info { display: flex; flex-direction: column; }
    .asset-name { font-weight: 700; color: white; font-size: 0.95rem; }
    .asset-symbol { font-size: 0.75rem; color: var(--text-muted); }
    .asset-price-box { display: flex; flex-direction: column; align-items: flex-end; }
    .asset-price { font-weight: 800; font-size: 0.95rem; transition: color 0.3s ease; }
    .asset-price.up { color: var(--success-green); }
    .asset-price.down { color: var(--danger-red); }
    .asset-change { font-size: 0.75rem; font-weight: 700; }
    .asset-change.up { color: var(--success-green); }
    .asset-change.down { color: var(--danger-red); }
    
    .form-input { background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); color: white; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; width: 100%; }
    .success { color: var(--success-green); }
    .fail { color: var(--danger-red); }
    @media (max-width: 768px) { .simulator-grid { grid-template-columns: 1fr; } .sim-wallet-card { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  enrolledCourses: Course[] = [];
  allCourses: Course[] = [];
  certificates: Certificate[] = [];
  categories: Category[] = [];
  stats: any = {};
  activities = [
    { time: 'Hace 2 horas', desc: 'Análisis de EUR/USD completado' },
    { time: 'Ayer', desc: 'Certificado en Trading de Futuros obtenido' },
    { time: 'Hace 3 días', desc: 'Depósito de conocimientos en portafolio de cripto' }
  ];

  showCreateModal = false;
  showCertModal = false;
  selectedCert?: Certificate;
  newCourse: Partial<Course> = {
    title: '',
    description: '',
    category: undefined,
    level: 'BEGINNER' as any,
    price: 0,
    duration: 0
  };

  activeMainTab: 'courses' | 'messages' | 'sales' | 'simulator' = 'courses';
  contacts: any[] = [];

  courseProgressMap: Map<number, number> = new Map();

  // SIMULATOR STATE
  virtualBalance = 10000.00;
  floatingPnL = 0.00;
  equity = 10000.00;
  activePositions: any[] = [];
  
  simulatedAssets = [
    { name: 'Bitcoin', symbol: 'BTC/USD', price: 64250.0, volatility: 0.003, decimals: 2, change: 0.15, direction: 'up' },
    { name: 'Ethereum', symbol: 'ETH/USD', price: 3420.0, volatility: 0.004, decimals: 2, change: -0.22, direction: 'down' },
    { name: 'Euro / Dólar', symbol: 'EUR/USD', price: 1.0850, volatility: 0.0005, decimals: 4, change: 0.02, direction: 'up' },
    { name: 'Oro de Londres', symbol: 'XAU/USD', price: 2350.0, volatility: 0.002, decimals: 2, change: 0.45, direction: 'up' },
    { name: 'Tesla Inc.', symbol: 'TSLA', price: 175.50, volatility: 0.008, decimals: 2, change: -1.10, direction: 'down' }
  ];

  selectedAssetSymbol = 'BTC/USD';
  tradeSize = 0.1;
  tradeType: 'LONG' | 'SHORT' = 'LONG';
  private priceSubscription?: Subscription;

  // ADMIN SVG CHART STATE
  adminChartMode: 'revenue' | 'students' = 'revenue';
  chartDataRevenue = [1200, 2800, 4500, 6200, 9800, 14200];
  chartDataStudents = [8, 15, 26, 38, 52, 74];
  chartLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  constructor(
    public authService: AuthService,
    private courseService: CourseService,
    private categoryService: CategoryService,
    private assessmentService: AssessmentService,
    private chatService: ChatService,
    private router: Router,
    public cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const isStudent = this.authService.isStudent();
    const isInstructor = this.authService.isInstructor() || this.authService.isAdmin();
    
    this.loadCategories();

    if (isStudent) {
      this.authService.refreshCurrentUser().subscribe();
      this.loadEnrolledCourses();
      this.loadCertificates();
    }
    if (isInstructor) {
      this.loadAllCourses();
      this.loadStats();
    }
    this.loadContacts();

    // LOAD SIMULATOR DATA
    const savedBalance = localStorage.getItem('virtualBalance');
    this.virtualBalance = savedBalance ? parseFloat(savedBalance) : 10000.00;
    const savedPositions = localStorage.getItem('activePositions');
    this.activePositions = savedPositions ? JSON.parse(savedPositions) : [];
    this.updateFloatingPnL();

    // INICIAR FEED DE COTIZACIONES EN TIEMPO REAL
    this.priceSubscription = interval(2500).subscribe(() => {
      this.tickPrices();
    });
  }

  ngOnDestroy(): void {
    if (this.priceSubscription) {
      this.priceSubscription.unsubscribe();
    }
  }

  // GAMIFICATION HELPERS
  getRankTitle(level: number): string {
    if (level <= 2) return 'Trader Aspirante';
    if (level <= 5) return 'Trader Institucional';
    if (level <= 9) return 'Gestor de Fondos';
    return 'Socio Fundeado';
  }

  getXpProgressPercentage(xp: number): number {
    return (xp % 1000) / 10;
  }

  getXpNeededForNextLevel(xp: number): number {
    return 1000 - (xp % 1000);
  }

  // SIMULATOR LOGIC
  tickPrices(): void {
    this.simulatedAssets.forEach(asset => {
      const volatility = asset.volatility;
      const changePercent = (Math.random() - 0.5) * volatility;
      const oldPrice = asset.price;
      asset.price = parseFloat((asset.price * (1 + changePercent)).toFixed(asset.decimals));
      asset.change = parseFloat((changePercent * 100).toFixed(2));
      asset.direction = asset.price >= oldPrice ? 'up' : 'down';
    });
    this.updateFloatingPnL();
    this.cd.detectChanges();
  }

  updateFloatingPnL(): void {
    let floating = 0;
    this.activePositions.forEach(pos => {
      const currentAsset = this.simulatedAssets.find(a => a.symbol === pos.symbol);
      if (currentAsset) {
        pos.currentPrice = currentAsset.price;
        const multiplier = pos.type === 'LONG' ? 1 : -1;
        pos.pnl = parseFloat(((pos.currentPrice - pos.entryPrice) * pos.size * multiplier).toFixed(2));
        floating += pos.pnl;
      }
    });
    this.floatingPnL = parseFloat(floating.toFixed(2));
    this.equity = parseFloat((this.virtualBalance + this.floatingPnL).toFixed(2));
  }

  openPosition(): void {
    const asset = this.simulatedAssets.find(a => a.symbol === this.selectedAssetSymbol);
    if (!asset || this.tradeSize <= 0) return;

    const totalCost = asset.price * this.tradeSize;
    const marginRequired = totalCost / 10; // 1:10 Leverage

    if (this.virtualBalance < marginRequired) {
      alert('Margen insuficiente en tu cuenta virtual.');
      return;
    }

    const newPos = {
      id: Date.now(),
      symbol: asset.symbol,
      type: this.tradeType,
      entryPrice: asset.price,
      currentPrice: asset.price,
      size: this.tradeSize,
      margin: parseFloat(marginRequired.toFixed(2)),
      pnl: 0.0
    };

    this.activePositions.push(newPos);
    this.updateFloatingPnL();
    this.saveSimulatorData();

    (window as any).appComponent.notificationService.showToast('SUCCESS', 'Operación Ejecutada ⚡', `Posición ${this.tradeType} en ${asset.symbol} abierta exitosamente.`);
    this.cd.detectChanges();
  }

  closePosition(id: number): void {
    const posIndex = this.activePositions.findIndex(p => p.id === id);
    if (posIndex === -1) return;

    const pos = this.activePositions[posIndex];
    this.virtualBalance = parseFloat((this.virtualBalance + pos.pnl).toFixed(2));
    this.activePositions.splice(posIndex, 1);
    
    this.updateFloatingPnL();
    this.saveSimulatorData();

    const toastType = pos.pnl >= 0 ? 'SUCCESS' : 'WARNING';
    const toastTitle = pos.pnl >= 0 ? '¡Operación Exitosa! 💰' : 'Operación Cerrada 📉';
    const sign = pos.pnl >= 0 ? '+' : '';
    
    (window as any).appComponent.notificationService.showToast(toastType, toastTitle, `Posición en ${pos.symbol} cerrada con P&L de ${sign}$${pos.pnl} USD.`);
    this.cd.detectChanges();
  }

  saveSimulatorData(): void {
    localStorage.setItem('virtualBalance', this.virtualBalance.toString());
    localStorage.setItem('activePositions', JSON.stringify(this.activePositions));
  }

  // SVG CHART HELPERS
  getMaxVal(data: number[]): number {
    return Math.max(...data, 100);
  }

  getMinVal(data: number[]): number {
    return Math.min(...data, 0);
  }

  getChartPath(data: number[]): string {
    if (!data || data.length === 0) return 'M 0 150 L 500 150';
    const maxVal = this.getMaxVal(data);
    const minVal = this.getMinVal(data);
    const range = maxVal - minVal || 1;
    
    let path = `M 0 150`;
    const stepX = 500 / (data.length - 1 || 1);
    
    data.forEach((val, idx) => {
      const x = idx * stepX;
      const y = 150 - ((val - minVal) / range) * 110 - 20;
      if (idx === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prevX = (idx - 1) * stepX;
        const prevY = 150 - ((data[idx - 1] - minVal) / range) * 110 - 20;
        const cpX1 = prevX + stepX / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + stepX / 2;
        const cpY2 = y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });
    return path;
  }

  getChartAreaPath(data: number[]): string {
    const strokePath = this.getChartPath(data);
    const stepX = 500 / (data.length - 1 || 1);
    const lastX = (data.length - 1) * stepX;
    return `${strokePath} L ${lastX} 150 L 0 150 Z`;
  }

  getActiveChartData(): number[] {
    return this.adminChartMode === 'revenue' ? this.chartDataRevenue : this.chartDataStudents;
  }

  // STANDARD HELPERS
  getCourseProgress(courseId: number): number {
    return this.courseProgressMap.get(courseId) || 0;
  }

  calculateGlobalProgress(): number {
    if (this.courseProgressMap.size === 0) return 0;
    let sum = 0;
    this.courseProgressMap.forEach(p => sum += p);
    return Math.round(sum / this.courseProgressMap.size);
  }

  loadStats(): void {
    this.courseService.getStats().subscribe(data => {
      this.stats = data;
      if (data.salesBreakdown && data.salesBreakdown.length > 0) {
        let sum = 0;
        const revPoints = [0];
        const studPoints = [0];
        data.salesBreakdown.forEach((item: any) => {
          sum += item.revenue || 0;
          revPoints.push(sum);
          studPoints.push(revPoints.length * 10);
        });
        this.chartDataRevenue = revPoints;
        this.chartDataStudents = studPoints;
      }
      this.cd.detectChanges();
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.cd.detectChanges();
    });
  }

  compareCategories(c1: Category, c2: Category): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  isFormValid(): boolean {
    return !!(this.newCourse.title && this.newCourse.description && this.newCourse.category && this.newCourse.price! >= 0);
  }

  createCourse(): void {
    if (this.isFormValid()) {
      this.courseService.createCourse(this.newCourse as Course).subscribe({
        next: (created) => {
          this.showCreateModal = false;
          this.router.navigate(['/course', created.id, 'manage']);
        },
        error: (err) => alert('Error al crear el curso')
      });
    }
  }

  loadCertificates(): void {
    this.assessmentService.getMyCertificates().subscribe(certs => {
      this.certificates = certs;
      this.cd.detectChanges();
    });
  }

  loadEnrolledCourses(): void {
    this.courseService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.enrolledCourses = Array.from(courses);
        this.enrolledCourses.forEach(c => {
          this.courseService.getCourseContent(c.id!).subscribe(content => {
            this.courseService.getCourseProgress(c.id!).subscribe(completedIds => {
              let total = 0;
              content.modules?.forEach(m => total += m.lessons?.length || 0);
              const progress = total > 0 ? Math.round((completedIds.length / total) * 100) : 0;
              this.courseProgressMap.set(c.id!, progress);
              this.cd.detectChanges();
            });
          });
        });
        this.cd.detectChanges();
        this.cd.markForCheck();
      },
      error: (err) => console.error('Error cargando cursos inscritos', err)
    });
  }

  loadAllCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.cd.detectChanges();
        this.cd.markForCheck();
      },
      error: (err) => console.error('Error cargando todos los cursos', err)
    });
  }

  viewCertificate(cert: Certificate): void {
    this.selectedCert = cert;
    this.showCertModal = true;
    this.cd.detectChanges();
  }

  loadContacts(): void {
    this.chatService.getContacts().subscribe(contacts => {
      const aiContact = {
        id: 0,
        username: 'Mastery Mentor AI',
        specialty: 'Trading Copilot & Mentor AI 🤖⚡',
        bio: 'Asistente de inteligencia artificial contextualmente entrenado en trading de precisión y desarrollo.',
        featured: true
      };
      if (this.authService.isStudent()) {
        this.contacts = [aiContact, ...contacts];
      } else {
        this.contacts = contacts;
      }
      this.cd.detectChanges();
      this.cd.markForCheck();
    });
  }

  openChat(contact: any): void {
    (window as any).appComponent.openChat(contact);
  }

  toggleCourseStatus(course: Course): void {
    const newStatus: any = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = { ...course, status: newStatus };
    this.courseService.updateCourse(course.id!, updated as Course).subscribe(() => {
      course.status = newStatus;
      this.cd.detectChanges();
    });
  }
}
