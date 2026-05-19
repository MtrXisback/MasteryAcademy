import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../services/course.service';
import { AssessmentService, Quiz, Question } from '../services/assessment.service';
import { Course } from '../models/course.model';
import { Lesson, Module } from '../models/course-content.model';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="management-container" *ngIf="course">
      <header class="mg-header">
        <button routerLink="/dashboard" class="btn-premium btn-ghost btn-sm">← Volver al Panel</button>
        <div class="header-info">
          <h1 class="gradient-text">Gestión Pro: {{ course.title }}</h1>
          <div class="status-badge" [class.published]="course.status === 'PUBLISHED'">
            {{ course.status === 'PUBLISHED' ? 'EN VIVO' : 'BORRADOR' }}
          </div>
        </div>
      </header>

      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'content'" (click)="activeTab = 'content'">📚 Contenido</button>
        <button class="tab-btn" [class.active]="activeTab === 'quiz'" (click)="activeTab = 'quiz'">📝 Examen Final</button>
        <button class="tab-btn" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">⚙️ Ajustes</button>
      </div>

      <div class="mg-content">
        <!-- PESTAÑA CONTENIDO -->
        <section class="modules-section" *ngIf="activeTab === 'content'">
          <div class="section-header">
            <h2>Estructura del Programa</h2>
            <button class="btn-premium btn-sm" (click)="showModuleForm = true">+ Nuevo Módulo</button>
          </div>

          <div class="new-item-card premium-card" *ngIf="showModuleForm">
            <input type="text" [(ngModel)]="newModuleTitle" placeholder="Nombre del módulo (Ej: Análisis Técnico Avanzado)">
            <div class="form-actions">
              <button class="btn-premium btn-ghost btn-sm" (click)="showModuleForm = false">Cancelar</button>
              <button class="btn-premium btn-sm" (click)="createModule()">Guardar Módulo</button>
            </div>
          </div>

          <div class="modules-list">
            <div class="module-card premium-card" *ngFor="let mod of course.modules">
              <div class="module-info">
                <h3>{{ mod.name }}</h3>
                <div class="mod-actions">
                  <button class="btn-icon delete" (click)="deleteModule(mod.id!)" title="Eliminar Módulo">🗑️</button>
                </div>
              </div>

              <div class="lessons-container">
                <div class="lesson-item" *ngFor="let lesson of mod.lessons">
                  <div class="lesson-main">
                    <span class="lesson-icon">{{ lesson.isExercise ? '✏️' : '📽️' }}</span>
                    <span class="lesson-title">{{ lesson.title }}</span>
                  </div>
                  <button class="btn-icon delete-sm" (click)="deleteLesson(lesson.id!)">×</button>
                </div>
                
                <button class="add-lesson-link" (click)="openLessonForm(mod)">+ Añadir Lección o Ejercicio</button>
              </div>
            </div>
          </div>
        </section>

        <!-- PESTAÑA EXAMEN -->
        <section class="quiz-section" *ngIf="activeTab === 'quiz'">
          <div class="section-header">
            <h2>Configuración del Examen</h2>
            <button class="btn-premium btn-sm" (click)="saveQuiz()">Guardar Cambios en Examen</button>
          </div>

          <div class="quiz-editor premium-card" *ngIf="currentQuiz">
            <div class="form-group">
              <label>Título del Examen</label>
              <input type="text" [(ngModel)]="currentQuiz.title" placeholder="Ej: Examen Final de Maestría">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Puntaje de Aprobación (%)</label>
                <input type="number" [(ngModel)]="currentQuiz.passingScore">
              </div>
            </div>

            <div class="questions-list">
              <div class="question-item premium-card" *ngFor="let q of currentQuiz.questions; let i = index">
                <div class="q-header">
                  <h4>Pregunta {{ i + 1 }}</h4>
                  <button class="btn-icon delete-sm" (click)="removeQuestion(i)">🗑️</button>
                </div>
                <input type="text" [(ngModel)]="q.text" placeholder="Escribe la pregunta aquí...">
                
                <div class="options-grid">
                  <div class="option-row" *ngFor="let opt of q.options; let optIdx = index; trackBy: trackByFn">
                    <input type="radio" [name]="'correct-' + i" [checked]="q.correctAnswerIndex === optIdx" (change)="q.correctAnswerIndex = optIdx">
                    <input type="text" [(ngModel)]="q.options[optIdx]" [placeholder]="'Opción ' + (optIdx + 1)">
                  </div>
                </div>
              </div>

              <button class="btn-premium btn-ghost w-full mt-4" (click)="addQuestion()">+ Añadir Pregunta al Examen</button>
            </div>
          </div>
        </section>

        <!-- PESTAÑA AJUSTES -->
        <section class="settings-section" *ngIf="activeTab === 'settings'">
          <div class="premium-card">
            <h2>Ajustes del Programa</h2>
            <div class="form-group mt-4">
              <label>Estado del Curso</label>
              <div class="toggle-container">
                <button [class.active]="course.status === 'DRAFT'" (click)="updateStatus('DRAFT')">Borrador</button>
                <button [class.active]="course.status === 'PUBLISHED'" (click)="updateStatus('PUBLISHED')">Publicado</button>
              </div>
            </div>
            <p class="info-text">Un curso publicado es visible para todos los estudiantes en la academia.</p>
          </div>
        </section>
      </div>

      <!-- Modal Lección / Ejercicio -->
      <div class="modal-overlay" *ngIf="selectedModuleForLesson">
        <div class="premium-card modal-content">
          <div class="modal-header">
            <h2 class="gradient-text">Nuevo Elemento en Módulo</h2>
            <button class="close-btn" (click)="selectedModuleForLesson = null">&times;</button>
          </div>
          
          <div class="form-group">
            <label>Tipo de Contenido</label>
            <select [(ngModel)]="newLesson.isExercise">
              <option [ngValue]="false">📽️ Video Lección</option>
              <option [ngValue]="true">✏️ Ejercicio Práctico</option>
            </select>
          </div>

          <div class="form-group">
            <label>Título del Elemento</label>
            <input type="text" [(ngModel)]="newLesson.title" placeholder="Ej: Introducción a Velas Japonesas o Ejercicio de Soportes">
          </div>

          <div class="form-group" *ngIf="!newLesson.isExercise">
            <label>ID de Video (YouTube)</label>
            <input type="text" [(ngModel)]="newLesson.contentUrl" placeholder="Ej: dQw4w9WgXcQ">
          </div>

          <div class="form-group" *ngIf="newLesson.isExercise">
            <label>Pregunta o Enunciado del Ejercicio</label>
            <input type="text" [(ngModel)]="newLesson.exerciseQuestion" placeholder="Ej: ¿Qué tipo de vela indica reversión alcista?">
          </div>

          <div class="form-group" *ngIf="newLesson.isExercise">
            <label>Opciones de Respuesta</label>
            <div class="options-creation-grid">
              <div class="option-creation-row" *ngFor="let opt of [0,1,2,3]">
                <input type="radio" name="modal-correct" [checked]="newLesson.correctOptionIndex === opt" (change)="newLesson.correctOptionIndex = opt">
                <input type="text" [(ngModel)]="newLesson.exerciseOptionsArray[opt]" [placeholder]="'Opción ' + (opt + 1)">
              </div>
            </div>
            <span class="info-text">Selecciona el botón de radio al lado de la respuesta correcta.</span>
          </div>

          <div class="form-group">
            <label>Descripción / Instrucciones</label>
            <textarea [(ngModel)]="newLesson.description" rows="3"></textarea>
          </div>

          <div class="form-actions mt-4">
            <button class="btn-premium btn-ghost w-full" (click)="selectedModuleForLesson = null">Cancelar</button>
            <button class="btn-premium w-full" (click)="createLesson()">Subir Elemento</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management-container { padding: 2rem 0; animation: fadeIn 0.5s ease; color: white; }
    .mg-header { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
    .header-info { display: flex; align-items: center; gap: 1.5rem; }
    
    .status-badge { 
      padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800;
      background: rgba(255,255,255,0.1); border: 1px solid var(--border-glass);
    }
    .status-badge.published { background: var(--success-green-low); border-color: var(--success-green); color: var(--success-green); }

    .tabs-container { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem; }
    .tab-btn { 
      background: none; border: none; color: var(--text-muted); font-weight: 700; padding: 0.75rem 1.5rem; 
      cursor: pointer; transition: all 0.3s; border-radius: 12px;
    }
    .tab-btn.active { background: var(--primary-gold-low); color: var(--primary-gold); }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    
    .new-item-card { margin-bottom: 2rem; padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center; }
    .new-item-card input { flex-grow: 1; }

    .modules-list { display: grid; gap: 1.5rem; }
    .module-card { padding: 2rem; }
    .module-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 1rem; }
    
    .lessons-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .lesson-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border-radius: 12px;
    }
    .lesson-main { display: flex; align-items: center; gap: 0.75rem; }
    .lesson-icon { opacity: 0.5; }
    .add-lesson-link { 
      background: none; border: 1px dashed var(--border-glass); color: var(--primary-gold); 
      font-weight: 700; padding: 1rem; cursor: pointer; font-size: 0.85rem; border-radius: 12px; margin-top: 1rem;
    }
    .add-lesson-link:hover { background: var(--primary-gold-low); border-style: solid; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .question-item { padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-glass); }
    .q-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
    .option-row { display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px; }

    .toggle-container { display: flex; gap: 0.5rem; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 12px; width: fit-content; }
    .toggle-container button { 
      padding: 0.5rem 1.5rem; border: none; background: none; color: var(--text-muted); cursor: pointer; border-radius: 8px; font-weight: 700;
    }
    .toggle-container button.active { background: var(--primary-gold); color: black; }
    .info-text { font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem; }

    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content { width: 100%; max-width: 600px; padding: 2.5rem; }
    
    .btn-icon { background: none; border: none; cursor: pointer; opacity: 0.6; font-size: 1.2rem; }
    .btn-icon:hover { opacity: 1; transform: scale(1.1); }
    .btn-icon.delete { color: #ef4444; }

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
    
    .options-creation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }
    .option-creation-row { display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CourseManagementComponent implements OnInit {
  course?: Course;
  activeTab: 'content' | 'quiz' | 'settings' = 'content';
  showModuleForm = false;
  newModuleTitle = '';
  
  selectedModuleForLesson: Module | null = null;
  newLesson: any = { 
    title: '', 
    contentUrl: '', 
    description: '', 
    orderIndex: 1, 
    isExercise: false,
    exerciseQuestion: '',
    exerciseOptionsArray: ['', '', '', ''],
    correctOptionIndex: 0
  };

  currentQuiz: Quiz = {
    title: '',
    description: '',
    passingScore: 70,
    questions: []
  };

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private assessmentService: AssessmentService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourseContent(+courseId);
      this.loadQuiz(+courseId);
    }
  }

  loadCourseContent(id: number): void {
    this.courseService.getCourseContent(id).subscribe({
      next: (data) => {
        this.course = data;
        this.cd.detectChanges();
      }
    });
  }

  loadQuiz(courseId: number): void {
    this.assessmentService.getQuizByCourse(courseId).subscribe({
      next: (quiz: Quiz) => {
        if (quiz) this.currentQuiz = quiz;
        this.cd.detectChanges();
      },
      error: () => {
        this.currentQuiz = { title: 'Examen Final', description: 'Valida tus conocimientos', passingScore: 70, questions: [] };
      }
    });
  }

  createModule(): void {
    if (!this.newModuleTitle || !this.course) return;
    this.courseService.addModule(this.course.id!, { name: this.newModuleTitle, orderIndex: (this.course.modules?.length || 0) + 1 })
      .subscribe(() => {
        this.newModuleTitle = '';
        this.showModuleForm = false;
        this.loadCourseContent(this.course!.id!);
      });
  }

  deleteModule(id: number): void {
    if (confirm('¿Estás seguro de eliminar este módulo y todas sus lecciones?')) {
      this.courseService.deleteModule(id).subscribe(() => this.loadCourseContent(this.course!.id!));
    }
  }

  openLessonForm(module: Module): void {
    this.selectedModuleForLesson = module;
    this.newLesson = { 
      title: '', 
      contentUrl: '', 
      description: '', 
      orderIndex: (module.lessons?.length || 0) + 1,
      isExercise: false,
      exerciseQuestion: '',
      exerciseOptionsArray: ['', '', '', ''],
      correctOptionIndex: 0
    };
  }

  createLesson(): void {
    if (!this.newLesson.title || !this.selectedModuleForLesson) return;
    
    if (this.newLesson.isExercise) {
      // Unir las opciones con un delimitador pipe (|)
      const validOptions = this.newLesson.exerciseOptionsArray.map((o: string) => o.trim()).filter((o: string) => o !== '');
      if (validOptions.length < 2) {
        alert('Por favor, ingresa al menos 2 opciones de respuesta.');
        return;
      }
      this.newLesson.exerciseOptions = validOptions.join('|');
      this.newLesson.contentUrl = ''; // No tiene video
    } else {
      this.newLesson.isExercise = false;
      this.newLesson.exerciseQuestion = null;
      this.newLesson.exerciseOptions = null;
      this.newLesson.correctOptionIndex = null;
    }
    
    this.courseService.addLesson(this.selectedModuleForLesson.id!, this.newLesson)
      .subscribe(() => {
        this.selectedModuleForLesson = null;
        this.loadCourseContent(this.course!.id!);
      });
  }

  deleteLesson(id: number): void {
    if (confirm('¿Eliminar esta lección?')) {
      this.courseService.deleteLesson(id).subscribe(() => this.loadCourseContent(this.course!.id!));
    }
  }

  // Quiz Management
  addQuestion(): void {
    this.currentQuiz.questions.push({
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0
    });
  }

  removeQuestion(index: number): void {
    this.currentQuiz.questions.splice(index, 1);
  }

  saveQuiz(): void {
    if (this.course?.id) {
      this.assessmentService.saveQuiz(this.course.id, this.currentQuiz).subscribe({
        next: () => alert('¡Examen guardado correctamente!'),
        error: () => alert('Error al guardar el examen')
      });
    }
  }

  updateStatus(status: 'DRAFT' | 'PUBLISHED'): void {
    if (this.course) {
      const updatedCourse = { ...this.course, status };
      this.courseService.updateCourse(this.course.id!, updatedCourse).subscribe(() => {
        this.course!.status = status;
        this.cd.detectChanges();
      });
    }
  }

  trackByFn(index: any, item: any) {
    return index;
  }
}
