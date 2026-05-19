import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AssessmentService, Quiz } from '../services/assessment.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="quiz-container">
      <!-- Cargando -->
      <div class="loading-state premium-card" *ngIf="loading && !errorMessage">
        <div class="spinner"></div>
        <p>Iniciando entorno de evaluación...</p>
      </div>

      <!-- Error o No Encontrado -->
      <div class="error-state premium-card" *ngIf="errorMessage">
        <div class="error-icon">⚠️</div>
        <h2>Evaluación no disponible</h2>
        <p>{{ errorMessage }}</p>
        <button class="btn-premium" routerLink="/dashboard">Volver al Panel</button>
      </div>

      <ng-container *ngIf="quiz && !loading">
        <div class="quiz-header premium-card">
          <h1 class="gradient-text">{{ quiz.title }}</h1>
          <p>{{ quiz.description }}</p>
          <div class="quiz-meta">
            <span>Aprobación: {{ quiz.passingScore }}%</span>
            <span>Preguntas: {{ quiz.questions.length }}</span>
          </div>
        </div>

        <div class="questions-list" *ngIf="!submitted">
          <div class="question-card premium-card" *ngFor="let q of quiz.questions; let i = index">
            <h3><span class="q-num">{{ i + 1 }}.</span> {{ q.text }}</h3>
            <div class="options">
              <label class="option-item" *ngFor="let opt of q.options; let optIdx = index">
                <input type="radio" [name]="'q'+i" [(ngModel)]="userAnswers[i]" [value]="optIdx">
                <span class="custom-radio"></span>
                <span class="opt-text">{{ opt }}</span>
              </label>
            </div>
          </div>

          <div class="quiz-footer">
            <button class="btn-premium" (click)="submit()" [disabled]="!isComplete()">Finalizar Examen</button>
          </div>
        </div>

        <!-- Resultados -->
        <div class="result-card premium-card" *ngIf="submitted">
          <div class="result-icon" [class.success]="passed" [class.fail]="!passed">
            {{ passed ? '🏆' : '❌' }}
          </div>
          <h2 [class.success]="passed" [class.fail]="!passed">
            {{ passed ? '¡Felicidades, Eres un Maestro!' : 'Sigue Practicando' }}
          </h2>
          <p class="result-text">
            {{ passed 
              ? 'Has aprobado el examen final. Tu certificado de experto ya ha sido emitido.' 
              : 'No has alcanzado la puntuación mínima. Repasa los módulos y vuelve a intentarlo.' 
            }}
          </p>
          <div class="result-actions">
            <button class="btn-premium" routerLink="/dashboard">Volver al Panel</button>
            <button class="btn-premium btn-ghost" *ngIf="!passed" (click)="retry()">Reintentar</button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .quiz-container { max-width: 900px; margin: 4rem auto; padding: 0 2rem; }
    .quiz-header { padding: 3rem; text-align: center; margin-bottom: 3rem; }
    .quiz-meta { display: flex; justify-content: center; gap: 2rem; margin-top: 1.5rem; font-weight: 800; color: var(--primary-gold); font-size: 0.9rem; }
    
    .question-card { padding: 2.5rem; margin-bottom: 2rem; }
    .q-num { color: var(--primary-gold); margin-right: 0.5rem; }
    .options { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    
    .option-item {
      display: flex; align-items: center; gap: 1rem; padding: 1rem;
      background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass);
      border-radius: 12px; cursor: pointer; transition: all 0.3s;
    }
    .option-item:hover { background: var(--bg-card-hover); border-color: var(--primary-gold); }
    
    input[type="radio"] { display: none; }
    .custom-radio { width: 20px; height: 20px; border: 2px solid var(--border-glass); border-radius: 50%; position: relative; }
    input[type="radio"]:checked + .custom-radio { border-color: var(--primary-gold); }
    input[type="radio"]:checked + .custom-radio::after {
      content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 10px; height: 10px; background: var(--primary-gold); border-radius: 50%;
    }

    .quiz-footer { display: flex; justify-content: center; margin-top: 3rem; }
    
    .loading-state, .error-state { padding: 5rem; text-align: center; }
    .spinner { 
      width: 50px; height: 50px; border: 5px solid rgba(212, 175, 55, 0.1); 
      border-top-color: var(--primary-gold); border-radius: 50%; margin: 0 auto 2rem;
      animation: spin 1s linear infinite;
    }
    .error-icon { font-size: 4rem; margin-bottom: 1.5rem; }
    
    .result-card { padding: 4rem; text-align: center; animation: slideUp 0.5s ease; }
    .result-icon { font-size: 5rem; margin-bottom: 1.5rem; }
    .result-text { color: var(--text-muted); margin: 1.5rem 0 3rem; font-size: 1.1rem; line-height: 1.6; }
    .result-actions { display: flex; justify-content: center; gap: 1.5rem; }
    
    .success { color: var(--success-green); }
    .fail { color: var(--danger-red); }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class QuizComponent implements OnInit {
  quiz?: Quiz;
  userAnswers: number[] = [];
  submitted = false;
  passed = false;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private assessmentService: AssessmentService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (courseId) {
      this.loading = true;
      this.assessmentService.getQuizByCourse(+courseId).subscribe({
        next: (q: Quiz) => {
          this.quiz = q;
          this.userAnswers = new Array(q.questions.length).fill(-1);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'No se pudo cargar el examen. Es posible que aún no haya sido creado para este curso.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  isComplete(): boolean {
    return this.userAnswers.every(a => a !== -1);
  }

  submit(): void {
    if (this.quiz && this.quiz.id) {
      this.assessmentService.submitQuiz(this.quiz.id, this.userAnswers).subscribe(res => {
        this.submitted = true;
        this.passed = res.passed;
        if (this.passed) {
          this.authService.refreshCurrentUser().subscribe();
        }
        this.cdr.detectChanges();
      });
    }
  }

  retry(): void {
    this.submitted = false;
    this.passed = false;
    this.userAnswers = new Array(this.quiz?.questions.length).fill(-1);
    this.cdr.detectChanges();
  }
}
