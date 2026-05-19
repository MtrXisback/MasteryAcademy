import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../services/course.service';
import { DiscussionService, Comment } from '../services/discussion.service';
import { ReviewService, Review } from '../services/review.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Course } from '../models/course.model';
import { Lesson, Module } from '../models/course-content.model';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="player-layout" *ngIf="course">
      <div class="video-section">
        <header class="player-header premium-card">
          <button routerLink="/dashboard" class="back-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Dashboard</span>
          </button>
          <div class="course-nav-info">
            <h1 class="gradient-text">{{ course.title || 'Programa de Maestría' }}</h1>
            <div class="header-actions-row">
              <div class="lesson-indicator">
                <span class="pulse-dot"></span>
                <p class="current-mod-text" *ngIf="currentLesson">{{ currentLesson.title }}</p>
              </div>
              <button class="btn-chat-mentor pulse-gold-small" (click)="contactInstructor()">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
                <span>Consultar al Mentor</span>
              </button>
            </div>
          </div>
        </header>

        <div class="video-container premium-card">
          <ng-container *ngIf="currentLesson">
            <!-- Reproductor de Video Estándar -->
            <iframe 
              *ngIf="!currentLesson.isExercise"
              [src]="safeVideoUrl" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>

            <!-- Panel de Ejercicio Interactivo Premium -->
            <div *ngIf="currentLesson.isExercise" class="interactive-exercise-container">
              <div class="exercise-icon">✏️</div>
              <h2 class="gradient-text">{{ currentLesson.title }}</h2>
              <p class="exercise-intro">Lee la pregunta analítica y selecciona la respuesta correcta para consolidar tu conocimiento.</p>
              
              <div class="exercise-card">
                <p class="question-text">{{ currentLesson.exerciseQuestion }}</p>
                
                <div class="exercise-options">
                  <button 
                    *ngFor="let opt of getOptionsList(currentLesson.exerciseOptions); let idx = index"
                    class="exercise-opt-btn"
                    [class.selected]="selectedExerciseOption === idx"
                    [class.success]="exerciseSubmitted && idx === currentLesson.correctOptionIndex"
                    [class.error]="exerciseSubmitted && selectedExerciseOption === idx && idx !== currentLesson.correctOptionIndex"
                    (click)="selectExerciseOption(idx)"
                    [disabled]="exerciseSubmitted">
                    <span class="opt-indicator">{{ getAlphabetLetter(idx) }}</span>
                    <span class="opt-label">{{ opt }}</span>
                  </button>
                </div>

                <div class="exercise-feedback mt-5" *ngIf="exerciseSubmitted">
                  <div class="feedback-box success-box" *ngIf="isExerciseCorrect">
                    <h3>¡Excelente análisis, Trader! 🚀</h3>
                    <p>Has respondido correctamente. ¡Se te han otorgado tus XP de aprendizaje!</p>
                  </div>
                  <div class="feedback-box error-box" *ngIf="!isExerciseCorrect">
                    <h3>Análisis Incorrecto ❌</h3>
                    <p>Revisa la teoría de este módulo e inténtalo de nuevo.</p>
                  </div>
                </div>

                <div class="exercise-actions mt-5">
                  <button 
                    *ngIf="!exerciseSubmitted"
                    class="btn-premium w-full"
                    [disabled]="selectedExerciseOption === null"
                    (click)="submitExerciseAnswer()">
                    Validar Respuesta
                  </button>
                  <button 
                    *ngIf="exerciseSubmitted && !isExerciseCorrect"
                    class="btn-premium btn-ghost w-full"
                    (click)="resetExercise()">
                    Intentar de Nuevo
                  </button>
                  <button 
                    *ngIf="exerciseSubmitted && isExerciseCorrect && !isLessonCompleted(currentLesson.id!)"
                    class="btn-premium w-full"
                    (click)="markAsCompleted()">
                    Completar Ejercicio y Avanzar
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <div class="no-video" *ngIf="!currentLesson">
            <p>Selecciona un módulo de trading para comenzar el análisis.</p>
          </div>
        </div>

        <div class="content-tabs">
          <button class="tab-btn" [class.active]="activeTab === 'info'" (click)="activeTab = 'info'">📝 Descripción</button>
          <button class="tab-btn" [class.active]="activeTab === 'community'" (click)="activeTab = 'community'">💬 Comunidad ({{ comments.length }})</button>
          <button class="tab-btn" [class.active]="activeTab === 'reviews'" (click)="activeTab = 'reviews'">⭐ Valoraciones</button>
          <button class="tab-btn" [class.active]="activeTab === 'notes'" (click)="activeTab = 'notes'">📓 Mis Notas</button>
        </div>

        <div class="tab-content">
          <!-- INFO TAB -->
          <div class="lesson-info premium-card" *ngIf="activeTab === 'info' && currentLesson">
            <div class="lesson-meta">
              <span class="badge-gold">LECCIÓN EN VIVO</span>
              <button 
                class="btn-premium btn-sm" 
                *ngIf="!isLessonCompleted(currentLesson.id!)"
                (click)="markAsCompleted()">
                Marcar como Completada
              </button>
              <span class="completed-badge" *ngIf="isLessonCompleted(currentLesson.id!)">
                ✅ Completada
              </span>
            </div>
            <h2 class="lesson-title">{{ currentLesson.title }}</h2>
            <p class="lesson-desc">{{ currentLesson.description }}</p>
          </div>

          <!-- COMMUNITY TAB -->
          <div class="community-section premium-card" *ngIf="activeTab === 'community'">
            <div class="comment-box">
              <textarea [(ngModel)]="newComment" placeholder="¿Tienes alguna duda técnica sobre esta lección? Pregunta aquí..."></textarea>
              <button class="btn-premium btn-sm mt-3" (click)="postComment()" [disabled]="!newComment.trim()">Publicar Consulta</button>
            </div>

            <div class="comments-list mt-5">
              <div class="comment-item" *ngFor="let comment of comments">
                <div class="user-avatar">{{ comment.user.username.substring(0,2).toUpperCase() }}</div>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user.username }}</span>
                    <span class="comment-date">{{ comment.createdAt | date:'short' }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <button 
                    *ngIf="comment.user.username === (authService.currentUser$ | async)?.username"
                    class="delete-comment" (click)="deleteComment(comment.id!)">Eliminar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- REVIEWS TAB -->
          <div class="reviews-section premium-card" *ngIf="activeTab === 'reviews'">
            <div class="review-form-container" *ngIf="!hasLeftReview">
              <h3>Tu Opinión Importa</h3>
              <p class="mb-4">Califica este programa para ayudar a otros traders.</p>
              <div class="star-rating">
                <span *ngFor="let s of [1,2,3,4,5]" (click)="newRating = s" [class.active]="newRating >= s">⭐</span>
              </div>
              <textarea [(ngModel)]="newReviewText" placeholder="Cuéntanos tu experiencia con este curso..." class="mt-3"></textarea>
              <button class="btn-premium btn-sm mt-3 w-full" (click)="submitReview()" [disabled]="newRating === 0">Enviar Reseña</button>
            </div>

            <div class="reviews-list mt-5">
              <div class="review-summary" *ngIf="reviews.length > 0">
                <div class="avg-score">{{ calculateAverageRating().toFixed(1) }}</div>
                <div class="avg-stars">
                   <div class="stars-gold">★★★★★</div>
                   <span>Basado en {{ reviews.length }} opiniones</span>
                </div>
              </div>

              <div class="review-item" *ngFor="let r of reviews">
                <div class="review-header">
                  <span class="author">{{ r.user.username }}</span>
                  <div class="rating-badge">⭐ {{ r.rating }}</div>
                </div>
                <p class="comment">{{ r.comment }}</p>
                <span class="date">{{ r.createdAt | date:'mediumDate' }}</span>
              </div>

              <div class="empty-state" *ngIf="reviews.length === 0">
                <p>Aún no hay reseñas. ¡Sé el primero en dar tu opinión!</p>
              </div>
            </div>
          </div>

          <!-- NOTES TAB -->
          <div class="notes-section premium-card" *ngIf="activeTab === 'notes' && currentLesson">
            <div class="notes-header-row">
              <h3>Mis Apuntes Privados</h3>
              <div class="save-status" [class.saving]="saveStatus === 'saving'">
                <span class="dot"></span>
                <span>{{ saveStatus === 'saving' ? 'Guardando...' : 'Guardado Automático ⚡' }}</span>
              </div>
            </div>
            
            <div class="notes-editor-container">
              <textarea 
                [(ngModel)]="currentNote" 
                (ngModelChange)="saveNote()" 
                placeholder="Escribe tus apuntes, resúmenes o dudas técnicas sobre esta lección aquí..." 
                class="notes-textarea">
              </textarea>
            </div>
            
            <div class="notes-footer-row mt-3">
              <div class="word-counter">
                <span>{{ currentNote.length }} caracteres</span>
              </div>
              <div class="notes-actions-toolbar">
                <button class="btn-premium btn-ghost btn-sm" (click)="copyNote()">
                  <span>{{ copyFeedback ? '¡Copiado! ✓' : '📋 Copiar Apuntes' }}</span>
                </button>
                <button class="btn-premium btn-ghost btn-sm" (click)="clearNote()" [disabled]="!currentNote">
                  <span>🗑️ Limpiar</span>
                </button>
                <button class="btn-premium btn-sm" (click)="downloadNotebook()">
                  <span>📥 Descargar Todo mi Cuaderno</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="playlist-section">
        <div class="playlist-header">
          <h3>Estructura del Programa</h3>
          <div class="progress-info">
            <div class="progress-header">
              <span>Progreso: {{ calculateProgress() }}%</span>
              <button 
                *ngIf="calculateProgress() === 100" 
                class="btn-premium btn-sm pulse-gold" 
                [routerLink]="['/quiz', course.id]">
                EXAMEN FINAL 🏆
              </button>
            </div>
            <div class="progress-bar-mini">
              <div class="progress-fill" [style.width.%]="calculateProgress()"></div>
            </div>
          </div>
        </div>
        
        <div class="modules-accordion">
          <div class="module-item" *ngFor="let mod of course.modules">
            <div class="module-header">
              <span class="mod-name">{{ mod.name }}</span>
              <span class="mod-count">{{ mod.lessons.length || 0 }} Temas</span>
            </div>
            <ul class="lessons-list">
              <li 
                *ngFor="let lesson of mod.lessons" 
                [class.active]="currentLesson?.id === lesson.id"
                [class.completed]="isLessonCompleted(lesson.id!)"
                (click)="selectLesson(lesson)">
                <div class="play-status">
                  <span class="status-dot"></span>
                </div>
                <div class="lesson-details">
                  <div class="ltitle-row">
                    <span class="ltitle">
                      <span class="lesson-type-badge">{{ lesson.isExercise ? '✏️' : '📽️' }}</span>
                      {{ lesson.title }}
                    </span>
                    <svg *ngIf="isLessonCompleted(lesson.id!)" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span class="lstatus" [class.done]="isLessonCompleted(lesson.id!)">
                    {{ isLessonCompleted(lesson.id!) ? 'Completado' : (lesson.isExercise ? 'Ejercicio Pendiente' : 'Lección Pendiente') }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .player-layout { display: grid; grid-template-columns: 1fr 400px; height: calc(100vh - 80px); background: #050505; color: white; }
    
    /* Estilos del Ejercicio Interactivo */
    .interactive-exercise-container { 
      padding: 2.5rem; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      height: 100%; 
      background: #090909; 
      overflow-y: auto;
      text-align: center;
    }
    .exercise-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .exercise-intro { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; max-width: 500px; }
    .exercise-card { 
      background: rgba(255,255,255,0.01); 
      border: 1px solid var(--border-glass); 
      padding: 2rem; 
      border-radius: 20px; 
      width: 100%; 
      max-width: 600px; 
      text-align: left;
    }
    .question-text { font-size: 1.15rem; font-weight: 800; color: #fff; margin-bottom: 1.5rem; line-height: 1.5; }
    .exercise-options { display: flex; flex-direction: column; gap: 0.85rem; }
    .exercise-opt-btn { 
      background: rgba(255,255,255,0.02); 
      border: 1px solid var(--border-glass); 
      padding: 1rem 1.25rem; 
      border-radius: 12px; 
      color: white; 
      cursor: pointer; 
      font-weight: 600; 
      text-align: left; 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
      transition: all 0.3s; 
      font-family: inherit;
    }
    .exercise-opt-btn:hover:not([disabled]) { background: rgba(255,255,255,0.05); border-color: var(--primary-gold); }
    .exercise-opt-btn.selected { border-color: var(--primary-gold); background: var(--primary-gold-low); }
    .exercise-opt-btn.success { border-color: var(--success-green); background: var(--success-green-low); color: white; }
    .exercise-opt-btn.error { border-color: var(--danger-red); background: var(--danger-red-low); color: white; }
    .opt-indicator { 
      width: 28px; height: 28px; border-radius: 50%; 
      background: rgba(255,255,255,0.05); 
      display: flex; align-items: center; justify-content: center; 
      font-size: 0.8rem; font-weight: 900; color: var(--text-muted);
      flex-shrink: 0;
    }
    .selected .opt-indicator { background: var(--primary-gold); color: black; }
    .success .opt-indicator { background: var(--success-green); color: white; }
    .error .opt-indicator { background: var(--danger-red); color: white; }
    .opt-label { font-size: 0.95rem; line-height: 1.4; }
    
    .feedback-box { padding: 1.25rem; border-radius: 12px; margin-top: 1.5rem; text-align: center; }
    .feedback-box.success-box { background: var(--success-green-low); border: 1px solid var(--success-green); }
    .feedback-box.success-box h3 { color: var(--success-green); margin-bottom: 0.25rem; font-size: 1.05rem; }
    .feedback-box.success-box p { font-size: 0.85rem; color: #a3e635; margin: 0; }
    .feedback-box.error-box { background: var(--danger-red-low); border: 1px solid var(--danger-red); }
    .feedback-box.error-box h3 { color: var(--danger-red); margin-bottom: 0.25rem; font-size: 1.05rem; }
    .feedback-box.error-box p { font-size: 0.85rem; color: #fca5a5; margin: 0; }
    
    .lesson-type-badge { margin-right: 0.4rem; opacity: 0.8; }
    .video-section { padding: 2rem 3rem; overflow-y: auto; }
    .player-header { 
      margin-bottom: 2rem; 
      display: flex; 
      align-items: center; 
      gap: 2.5rem; 
      padding: 1.25rem 2rem;
      background: rgba(255,255,255,0.02);
      border-radius: 20px;
    }
    .course-nav-info { flex-grow: 1; }
    .course-nav-info h1 { font-size: 1.4rem; margin-bottom: 0.4rem; letter-spacing: -0.5px; }
    .header-actions-row { display: flex; align-items: center; gap: 2rem; }
    
    .lesson-indicator { display: flex; align-items: center; gap: 0.75rem; }
    .pulse-dot { width: 8px; height: 8px; background: var(--primary-gold); border-radius: 50%; box-shadow: 0 0 10px var(--primary-gold); animation: pulse-soft 2s infinite; }
    @keyframes pulse-soft { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

    .current-mod-text { color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    
    .btn-chat-mentor { 
      background: var(--grad-gold); 
      color: black; 
      padding: 0.6rem 1.25rem; 
      border-radius: 12px; 
      cursor: pointer; 
      font-weight: 800; 
      font-size: 0.8rem; 
      transition: 0.3s; 
      display: flex; 
      align-items: center; 
      gap: 0.6rem;
      border: none;
    }
    .btn-chat-mentor:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(251, 191, 36, 0.3); }
    
    .pulse-gold-small { animation: pulse-gold-small 3s infinite; }
    @keyframes pulse-gold-small { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }

    .video-container { width: 100%; aspect-ratio: 16 / 9; background: black; border-radius: 20px; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    iframe { width: 100%; height: 100%; }

    .content-tabs { display: flex; gap: 2rem; border-bottom: 1px solid var(--border-glass); margin-bottom: 2rem; }
    .tab-btn { background: none; border: none; color: var(--text-muted); padding: 1rem 0; cursor: pointer; font-weight: 700; transition: all 0.3s; position: relative; }
    .tab-btn.active { color: var(--primary-gold); }
    .tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--primary-gold); }

    .lesson-info, .community-section, .reviews-section { padding: 2rem; }
    
    .comment-box textarea, .review-form-container textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 12px; color: white; padding: 1.25rem; min-height: 100px; resize: none; font-family: inherit; }

    .comment-item { display: flex; gap: 1.25rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .user-avatar { width: 40px; height: 40px; background: var(--primary-gold-low); color: var(--primary-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; flex-shrink: 0; }
    .comment-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .comment-author { font-weight: 700; font-size: 0.9rem; }
    .comment-date { font-size: 0.75rem; color: var(--text-muted); }
    .comment-text { font-size: 0.95rem; color: var(--text-main); line-height: 1.6; }

    .star-rating { display: flex; gap: 0.5rem; font-size: 1.5rem; cursor: pointer; }
    .star-rating span { filter: grayscale(1); opacity: 0.3; transition: 0.3s; }
    .star-rating span.active { filter: grayscale(0); opacity: 1; transform: scale(1.2); }

    .review-summary { display: flex; align-items: center; gap: 2rem; background: var(--bg-card); padding: 2rem; border-radius: 20px; margin-bottom: 3rem; }
    .avg-score { font-size: 3.5rem; font-weight: 900; color: var(--primary-gold); }
    .avg-stars { display: flex; flex-direction: column; gap: 0.25rem; }
    .stars-gold { color: var(--primary-gold); font-size: 1.2rem; letter-spacing: 2px; }

    .review-item { background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 16px; margin-bottom: 1.5rem; border: 1px solid var(--border-glass); }
    .review-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .review-header .author { font-weight: 700; color: white; }
    .rating-badge { background: var(--primary-gold-low); color: var(--primary-gold); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 800; }
    .review-item .comment { font-size: 0.95rem; line-height: 1.6; color: var(--text-muted); }
    .review-item .date { font-size: 0.7rem; color: #555; display: block; margin-top: 1rem; }

    .playlist-section { background: #0a0a0a; border-left: 1px solid var(--border-glass); overflow-y: auto; }
    .playlist-header { padding: 2rem; border-bottom: 1px solid var(--border-glass); }
    .progress-bar-mini { height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-top: 1rem; }
    .progress-fill { height: 100%; background: var(--grad-gold); transition: width 0.5s ease; }

    .modules-accordion { padding: 1rem; }
    .module-header { display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-card); border-radius: 8px; margin-bottom: 0.75rem; }
    .mod-name { font-weight: 800; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; }
    .lessons-list { list-style: none; padding: 0; }
    .lessons-list li { padding: 0.85rem 1rem; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: 0.3s; margin-bottom: 0.25rem; }
    .lessons-list li:hover { background: var(--bg-card-hover); }
    .lessons-list li.active { background: var(--primary-gold-low); }
    .status-dot { width: 6px; height: 6px; background: #334155; border-radius: 50%; }
    .active .status-dot { background: var(--primary-gold); box-shadow: 0 0 8px var(--primary-gold); }
    .completed .status-dot { background: var(--success-green); }
    
    .lesson-details { flex-grow: 1; display: flex; flex-direction: column; gap: 0.25rem; }
    .ltitle-row { display: flex; justify-content: space-between; align-items: center; }
    .ltitle { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }
    .check-icon { width: 14px; height: 14px; color: var(--success-green); }
    .lstatus { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .lstatus.done { color: var(--success-green); font-weight: 700; }

    .back-btn { 
      background: rgba(255,255,255,0.05); 
      border: 1px solid var(--border-glass); 
      color: white; 
      padding: 0.6rem 1.2rem; 
      border-radius: 12px; 
      cursor: pointer; 
      font-size: 0.85rem; 
      display: flex; 
      align-items: center; 
      gap: 0.5rem;
      font-weight: 700;
      transition: 0.3s;
    }
    .back-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--text-muted); }
    .pulse-gold { animation: pulse-gold 2s infinite; }
    @keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }

    /* Estilos Premium del Notebook de Élite */
    .notes-section { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.4s ease; }
    .notes-header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 1rem; }
    .notes-header-row h3 { font-size: 1.15rem; margin: 0; font-weight: 800; color: white; }
    
    .save-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; transition: all 0.3s ease; }
    .save-status .dot { width: 6px; height: 6px; background: var(--primary-gold); border-radius: 50%; box-shadow: 0 0 8px var(--primary-gold); }
    .save-status.saving { color: white; }
    .save-status.saving .dot { background: var(--success-green); box-shadow: 0 0 8px var(--success-green); animation: pulse-soft 1s infinite; }
    
    .notes-editor-container { position: relative; }
    .notes-textarea { 
      width: 100%; 
      background: rgba(0,0,0,0.3); 
      border: 1px solid var(--border-glass); 
      border-radius: 16px; 
      color: white; 
      padding: 1.5rem; 
      min-height: 250px; 
      resize: vertical; 
      font-family: inherit; 
      font-size: 0.95rem; 
      line-height: 1.6; 
      transition: all 0.3s;
    }
    .notes-textarea:focus { border-color: var(--primary-gold); box-shadow: 0 0 15px rgba(251, 191, 36, 0.08); outline: none; }
    
    .notes-footer-row { display: flex; justify-content: space-between; align-items: center; }
    .word-counter { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .notes-actions-toolbar { display: flex; gap: 1rem; }
    .notes-actions-toolbar .btn-premium { font-size: 0.75rem; padding: 0.5rem 1rem; }
    .notes-actions-toolbar .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

    @media (max-width: 1024px) { .player-layout { grid-template-columns: 1fr; height: auto; } .playlist-section { border-left: none; border-top: 1px solid var(--border-glass); } }
  `]
})
export class CoursePlayerComponent implements OnInit {
  course?: Course;
  currentLesson?: Lesson;
  safeVideoUrl?: SafeResourceUrl;
  completedLessonIds: number[] = [];
  
  activeTab: 'info' | 'community' | 'reviews' | 'notes' = 'info';
  comments: Comment[] = [];
  newComment: string = '';
  
  currentNote: string = '';
  saveStatus: 'saved' | 'saving' = 'saved';
  copyFeedback: boolean = false;
  private saveTimeout?: any;

  reviews: Review[] = [];
  newRating: number = 0;
  newReviewText: string = '';
  hasLeftReview: boolean = false;

  // Estados del Ejercicio Interactivo
  selectedExerciseOption: number | null = null;
  exerciseSubmitted = false;
  isExerciseCorrect = false;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private discussionService: DiscussionService,
    private reviewService: ReviewService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourseContent(+courseId);
      this.loadProgress(+courseId);
      this.loadReviews(+courseId);
    }
  }

  loadCourseContent(id: number): void {
    this.courseService.getCourseContent(id).subscribe({
      next: (data) => {
        this.course = data;
        if (this.course.modules && this.course.modules.length > 0) {
          const firstMod = this.course.modules[0];
          if (firstMod.lessons && firstMod.lessons.length > 0) {
            this.selectLesson(firstMod.lessons[0]);
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadProgress(courseId: number): void {
    this.courseService.getCourseProgress(courseId).subscribe(ids => {
      this.completedLessonIds = ids;
      this.cdr.detectChanges();
    });
  }

  loadComments(lessonId: number): void {
    this.discussionService.getComments(lessonId).subscribe(comments => {
      this.comments = comments;
      this.cdr.detectChanges();
    });
  }

  loadReviews(courseId: number): void {
    this.reviewService.getReviews(courseId).subscribe(reviews => {
      this.reviews = reviews;
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.hasLeftReview = this.reviews.some(r => r.user.username === user.username);
        }
      });
      this.cdr.detectChanges();
    });
  }

  selectLesson(lesson: Lesson): void {
    // Guardar nota de la lección anterior si existe
    if (this.currentLesson?.id) {
      this.saveNoteImmediately();
    }
    
    this.currentLesson = lesson;
    const embedUrl = this.convertToEmbedUrl(lesson.contentUrl);
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.loadComments(lesson.id!);
    
    // Cargar nota de la nueva lección
    this.loadNote(lesson.id!);
    
    // Resetear ejercicio al cambiar de tema
    this.resetExercise();
    
    this.cdr.detectChanges();
  }

  // Métodos del Ejercicio Interactivo
  getOptionsList(optionsStr?: string): string[] {
    return optionsStr ? optionsStr.split('|') : [];
  }

  getAlphabetLetter(idx: number): string {
    return String.fromCharCode(65 + idx); // A, B, C, D...
  }

  selectExerciseOption(idx: number): void {
    if (this.exerciseSubmitted) return;
    this.selectedExerciseOption = idx;
    this.cdr.detectChanges();
  }

  submitExerciseAnswer(): void {
    if (!this.currentLesson || this.selectedExerciseOption === null) return;
    
    this.exerciseSubmitted = true;
    this.isExerciseCorrect = this.selectedExerciseOption === this.currentLesson.correctOptionIndex;
    this.cdr.detectChanges();
  }

  resetExercise(): void {
    this.selectedExerciseOption = null;
    this.exerciseSubmitted = false;
    this.isExerciseCorrect = false;
    this.cdr.detectChanges();
  }

  postComment(): void {
    if (!this.currentLesson || !this.newComment.trim()) return;
    this.discussionService.addComment(this.currentLesson.id!, this.newComment).subscribe(comment => {
      this.comments.unshift(comment);
      this.newComment = '';
      this.cdr.detectChanges();
    });
  }

  deleteComment(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta consulta?')) {
      this.discussionService.deleteComment(id).subscribe(() => {
        this.comments = this.comments.filter(c => c.id !== id);
        this.cdr.detectChanges();
      });
    }
  }

  submitReview(): void {
    if (!this.course?.id || this.newRating === 0) return;
    this.reviewService.addReview(this.course.id, this.newRating, this.newReviewText).subscribe(review => {
      this.reviews.unshift(review);
      this.hasLeftReview = true;
      this.newRating = 0;
      this.newReviewText = '';
      this.cdr.detectChanges();
    });
  }

  calculateAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / this.reviews.length;
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessonIds.includes(lessonId);
  }

  markAsCompleted(): void {
    if (!this.currentLesson?.id) return;
    this.courseService.completeLesson(this.currentLesson.id).subscribe({
      next: () => {
        if (this.course?.id) this.loadProgress(this.course.id);
        this.authService.refreshCurrentUser().subscribe();
      }
    });
  }

  contactInstructor(): void {
    if (this.course?.instructor) {
      (window as any).appComponent.openChat(this.course.instructor, this.course.id);
    } else {
      // Fallback a un admin si no hay instructor
      (window as any).appComponent.openChat({ id: 1, username: 'AdminMastery' }, this.course?.id);
    }
  }

  calculateProgress(): number {
    if (!this.course?.modules) return 0;
    let total = 0;
    this.course.modules.forEach(m => total += m.lessons?.length || 0);
    if (total === 0) return 0;
    return Math.round((this.completedLessonIds.length / total) * 100);
  }

  private convertToEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop() || '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  // LOGICA DEL CENTRO DE NOTAS (NOTEBOOK)
  loadNote(lessonId: number): void {
    this.currentNote = localStorage.getItem(`note_lesson_${lessonId}`) || '';
  }

  saveNote(): void {
    if (!this.currentLesson?.id) return;
    this.saveStatus = 'saving';
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Debounce de 800ms para evitar saturación de localStorage
    this.saveTimeout = setTimeout(() => {
      this.saveNoteImmediately();
    }, 800);
  }

  saveNoteImmediately(): void {
    if (!this.currentLesson?.id) return;
    if (this.currentNote.trim()) {
      localStorage.setItem(`note_lesson_${this.currentLesson.id}`, this.currentNote);
    } else {
      localStorage.removeItem(`note_lesson_${this.currentLesson.id}`);
    }
    this.saveStatus = 'saved';
    this.cdr.detectChanges();
  }

  copyNote(): void {
    if (!this.currentNote) return;
    navigator.clipboard.writeText(this.currentNote).then(() => {
      this.copyFeedback = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copyFeedback = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  clearNote(): void {
    if (!this.currentNote) return;
    if (confirm('¿Estás seguro de que deseas borrar todos los apuntes de esta lección? Esta acción no se puede deshacer.')) {
      this.currentNote = '';
      this.saveNoteImmediately();
    }
  }

  downloadNotebook(): void {
    if (!this.course || !this.course.modules) return;
    
    let content = `= CUADERNO DE ESTUDIO - MASTERY ACADEMY =\n`;
    content += `PROGRAMA: ${this.course.title.toUpperCase()}\n`;
    content += `ESTUDIANTE: ${this.authService.getUsername() || 'Estudiante de Élite'}\n`;
    content += `FECHA DE GENERACIÓN: ${new Date().toLocaleDateString()}\n`;
    content += `=========================================\n\n`;
    
    let totalNotes = 0;
    
    this.course.modules.forEach((mod, modIdx) => {
      let modHeaderAdded = false;
      
      mod.lessons.forEach((lesson, lesIdx) => {
        const note = localStorage.getItem(`note_lesson_${lesson.id}`);
        if (note && note.trim()) {
          if (!modHeaderAdded) {
            content += `\n📁 MÓDULO ${modIdx + 1}: ${mod.name.toUpperCase()}\n`;
            content += `-----------------------------------------\n`;
            modHeaderAdded = true;
          }
          
          content += `\n📖 Tema ${lesIdx + 1}: ${lesson.title}\n`;
          content += `📝 Apuntes:\n`;
          content += `${note.trim()}\n`;
          content += `\n-----------------------------------------\n`;
          totalNotes++;
        }
      });
    });
    
    if (totalNotes === 0) {
      alert('Tu cuaderno está vacío. Toma apuntes en cualquier lección antes de descargar.');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `${this.course.title.toLowerCase().replace(/\s+/g, '_')}_cuaderno_apuntes.md`;
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
