import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../services/course.service';
import { AssessmentService, Certificate } from '../services/assessment.service';
import { Course } from '../models/course.model';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="loading-state" *ngIf="!user">
      <div class="spinner"></div>
      <p>Cargando tu perfil de élite...</p>
    </div>

    <div class="profile-container" *ngIf="user">
      <header class="profile-header">
        <h1 class="gradient-text">Tu Identidad Mastery</h1>
        <p class="subtitle">Gestiona tu prestigio y seguridad en la academia.</p>
      </header>

      <div class="profile-grid">
        <!-- Sidebar Personal -->
        <aside class="personal-sidebar">
          <div class="user-card premium-card">
            <div class="avatar-container">
              <div class="avatar-large" *ngIf="!user.avatarUrl">{{ user.username.substring(0,2).toUpperCase() }}</div>
              <img class="avatar-large image" *ngIf="user.avatarUrl" [src]="user.avatarUrl" alt="Avatar">
              <div class="level-badge" *ngIf="authService.isStudent()">LVL {{ user.level || 1 }}</div>
            </div>
            <h2 class="mt-4">{{ user.fullName || user.username }}</h2>
            <span class="role-badge">{{ authService.isAdmin() ? 'ADMINISTRADOR' : (authService.isInstructor() ? 'INSTRUCTOR' : 'ESTUDIANTE VIP') }}</span>
            
            <div class="xp-container mt-5" *ngIf="authService.isStudent()">
              <div class="xp-info">
                <span>Prestigio (XP)</span>
                <span>{{ user.xp || 0 }} / {{ getNextLevelXp() }}</span>
              </div>
              <div class="xp-bar-bg">
                <div class="xp-bar-fill" [style.width.%]="calculateXpPercentage()"></div>
              </div>
              <p class="xp-hint">Faltan {{ getNextLevelXp() - (user.xp || 0) }} XP para el Nivel {{ (user.level || 1) + 1 }}</p>
            </div>
          </div>

          <div class="stats-summary premium-card mt-4" *ngIf="authService.isStudent()">
            <div class="stat-row">
              <span class="label">Programas</span>
              <span class="value">{{ enrolledCourses.length }}</span>
            </div>
            <div class="stat-row">
              <span class="label">Certificados</span>
              <span class="value">{{ certificates.length }}</span>
            </div>
          </div>
        </aside>

        <!-- Main Settings -->
        <main class="settings-area">
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab === 'account'" (click)="activeTab = 'account'">⚙️ Perfil</button>
            <button class="tab-btn" [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">🔐 Seguridad</button>
            <button class="tab-btn" *ngIf="authService.isStudent()" [class.active]="activeTab === 'progress'" (click)="activeTab = 'progress'">📊 Mis Logros</button>
          </div>

          <div class="tab-content premium-card">
            <!-- ACCOUNT SETTINGS -->
            <div *ngIf="activeTab === 'account'" class="fade-in">
              <h3>Datos Profesionales</h3>
              <div class="form-group mt-4">
                <label>Nombre de Usuario</label>
                <input type="text" [value]="user.username" disabled class="disabled-input">
                <p class="info">Tu identificador único en la red Mastery.</p>
              </div>

              <div class="form-row mt-4">
                <div class="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" [(ngModel)]="editData.fullName" placeholder="Ej: John Doe">
                </div>
                <div class="form-group">
                  <label>Especialidad (Ej: Trader Institucional)</label>
                  <input type="text" [(ngModel)]="editData.specialty" placeholder="Tu área de maestría">
                </div>
              </div>

              <div class="form-group mt-4">
                <label>Avatar URL (Foto de Perfil)</label>
                <input type="text" [(ngModel)]="editData.avatarUrl" placeholder="https://ejemplo.com/foto.jpg">
              </div>

              <div class="form-group mt-4">
                <label>Biografía Profesional</label>
                <textarea [(ngModel)]="editData.bio" rows="4" placeholder="Cuéntale a tus estudiantes tu trayectoria y visión de los mercados..."></textarea>
                <p class="info">Esta información aparecerá en tu perfil público de instructor.</p>
              </div>

              <button class="btn-premium mt-5 w-full" (click)="saveProfile()">Actualizar Perfil Profesional</button>
            </div>

            <!-- SECURITY SETTINGS -->
            <div *ngIf="activeTab === 'security'" class="fade-in">
              <h3>Gestión de Credenciales</h3>
              
              <!-- IF SOCIAL USER -->
              <div class="social-security-card mt-4" *ngIf="user.authProvider && user.authProvider !== 'LOCAL'">
                <div class="social-status-badge" [class.google]="user.authProvider === 'GOOGLE'" [class.github]="user.authProvider === 'GITHUB'">
                  <div class="pulse-dot"></div>
                  <img *ngIf="user.authProvider === 'GOOGLE'" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google">
                  <img *ngIf="user.authProvider === 'GITHUB'" src="https://www.svgrepo.com/show/512317/github-142.svg" class="white-icon" alt="Github">
                  <span>IDENTIDAD VERIFICADA VIA {{ user.authProvider }}</span>
                </div>
                <div class="security-info-box mt-4">
                  <p>Tu acceso a la terminal está <strong>blindado</strong> mediante protocolos de autenticación externa. La seguridad de tu cuenta está delegada y garantizada por <strong>{{ user.authProvider }}</strong>.</p>
                </div>
                <button class="btn-secondary-premium mt-4 w-full" (click)="showPasswordForm = !showPasswordForm">
                  <span *ngIf="!showPasswordForm">⚙️ Gestionar credenciales de respaldo</span>
                  <span *ngIf="showPasswordForm">✖️ Cancelar gestión de respaldo</span>
                </button>
              </div>

              <!-- PASSWORD FORM (Visible for LOCAL or if toggled) -->
              <div class="password-form-area" *ngIf="user.authProvider === 'LOCAL' || showPasswordForm">
                <div class="form-group mt-4">
                  <label>Contraseña Actual</label>
                  <input type="password" [(ngModel)]="securityData.oldPassword" placeholder="••••••••">
                </div>
                <div class="form-group mt-4">
                  <label>Nueva Contraseña</label>
                  <input type="password" [(ngModel)]="securityData.newPassword" placeholder="••••••••">
                </div>
                <button class="btn-premium mt-5 w-full" (click)="changePassword()">
                  {{ user.authProvider === 'LOCAL' ? 'Actualizar Seguridad' : 'Establecer Clave Mastery' }}
                </button>
              </div>
            </div>

            <!-- PROGRESS SUMMARY -->
            <div *ngIf="activeTab === 'progress'" class="fade-in">
              <h3>Tus Logros Educativos</h3>
              <div class="achievements-list mt-4">
                <div class="achieve-item" *ngFor="let course of enrolledCourses">
                  <div class="achieve-icon">📚</div>
                  <div class="achieve-info">
                    <h4>{{ course.title }}</h4>
                    <p>Estado: En Curso</p>
                  </div>
                </div>
                <div class="achieve-item gold" *ngFor="let cert of certificates">
                  <div class="achieve-icon">📜</div>
                  <div class="achieve-info">
                    <h4>Certificado: {{ cert.course.title }}</h4>
                    <p>Emitido: {{ cert.issuedAt | date:'mediumDate' }}</p>
                  </div>
                </div>
                <p class="empty-state" *ngIf="enrolledCourses.length === 0 && certificates.length === 0">
                  Aún no has iniciado tu formación. ¡Explora los cursos hoy!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .loading-state { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; }
    .spinner { width: 50px; height: 50px; border: 3px solid rgba(212, 175, 55, 0.1); border-top-color: var(--primary-gold); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .profile-container { padding: 3rem 0; animation: fadeIn 0.5s ease; color: white; }
    .profile-header { margin-bottom: 3rem; text-align: center; }
    .subtitle { color: var(--text-muted); margin-top: 0.5rem; }

    .profile-grid { display: grid; grid-template-columns: 320px 1fr; gap: 3rem; }
    
    .user-card { padding: 3rem 2rem; text-align: center; }
    .avatar-container { position: relative; width: 100px; margin: 0 auto; }
    .avatar-large { 
      width: 100px; height: 100px; background: var(--grad-gold); 
      border-radius: 50%; display: flex; align-items: center; justify-content: center; 
      font-size: 2.5rem; font-weight: 900; color: black; box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
      object-fit: cover;
    }
    .level-badge { 
      position: absolute; bottom: -5px; right: -5px; background: black; color: var(--primary-gold); 
      border: 2px solid var(--primary-gold); border-radius: 50px; padding: 0.2rem 0.6rem; 
      font-size: 0.65rem; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .role-badge { 
      display: inline-block; background: var(--primary-gold-low); color: var(--primary-gold); 
      padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.7rem; font-weight: 800; margin-top: 1rem;
    }

    .xp-container { text-align: left; }
    .xp-info { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.5rem; text-transform: uppercase; }
    .xp-bar-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
    .xp-bar-fill { height: 100%; background: var(--grad-gold); transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px var(--primary-gold); }
    .xp-hint { font-size: 0.7rem; color: #555; margin-top: 0.5rem; text-align: center; }

    .stats-summary { padding: 1.5rem; }
    .stat-row { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-glass); }
    .stat-row:last-child { border: none; }
    .stat-row .label { font-size: 0.8rem; color: var(--text-muted); }
    .stat-row .value { font-weight: 800; color: var(--primary-gold); }

    .tabs { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .tab-btn { 
      background: none; border: none; color: var(--text-muted); padding: 1rem 2rem; 
      cursor: pointer; font-weight: 700; transition: 0.3s; border-radius: 12px;
    }
    .tab-btn.active { background: var(--bg-card); color: var(--primary-gold); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }

    .tab-content { padding: 3rem; min-height: 400px; }
    .disabled-input { background: rgba(255,255,255,0.05) !important; color: #555 !important; cursor: not-allowed; }
    .info { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }

    .social-security-card { 
      background: rgba(255,255,255,0.02); 
      border: 1px solid var(--border-glass); 
      padding: 2rem; 
      border-radius: 20px;
      text-align: center;
    }
    .social-status-badge {
      display: inline-flex; align-items: center; gap: 0.75rem;
      padding: 0.8rem 1.5rem; border-radius: 50px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      font-weight: 800; font-size: 0.75rem; letter-spacing: 1px;
    }
    .social-status-badge.google { color: #4285F4; border-color: rgba(66, 133, 244, 0.2); }
    .social-status-badge.github { color: #fff; border-color: rgba(255, 255, 255, 0.2); }
    .social-status-badge img { width: 18px; }
    .social-status-badge .white-icon { filter: invert(1); }

    .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

    .security-info-box { background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--primary-gold); padding: 1.5rem; border-radius: 12px; text-align: left; }
    .security-info-box p { margin: 0; font-size: 0.85rem; line-height: 1.6; color: var(--text-muted); }
    .security-info-box strong { color: var(--primary-gold); text-transform: uppercase; font-size: 0.75rem; }

    .btn-secondary-premium {
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass);
      color: white; padding: 1rem; border-radius: 12px; cursor: pointer; font-weight: 700; transition: 0.3s;
    }
    .btn-secondary-premium:hover { background: rgba(255,255,255,0.1); border-color: var(--primary-gold); }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .achievements-list { display: flex; flex-direction: column; gap: 1rem; }
    .achieve-item { display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid var(--border-glass); }
    .achieve-item.gold { border-color: var(--primary-gold-low); background: rgba(212, 175, 55, 0.05); }
    .achieve-icon { font-size: 1.5rem; }
    .achieve-info h4 { margin: 0; font-size: 1rem; }
    .achieve-info p { margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--text-muted); }

    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 992px) { .profile-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  user: any;
  activeTab: 'account' | 'progress' | 'security' = 'account';
  enrolledCourses: Course[] = [];
  certificates: Certificate[] = [];
  
  editData = {
    fullName: '',
    avatarUrl: '',
    bio: '',
    specialty: ''
  };

  securityData = {
    oldPassword: '',
    newPassword: ''
  };

  showPasswordForm = false;

  constructor(
    public authService: AuthService,
    private courseService: CourseService,
    private assessmentService: AssessmentService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadStats();
  }

  loadUserData(): void {
    this.userService.getCurrentUser().subscribe(u => {
      this.user = u;
      if (!this.user.authProvider) {
        this.user.authProvider = 'LOCAL';
      }
      this.editData.fullName = u.fullName || '';
      this.editData.avatarUrl = u.avatarUrl || '';
      this.editData.bio = u.bio || '';
      this.editData.specialty = u.specialty || '';
      this.cdr.detectChanges();
    });
  }

  loadStats(): void {
    this.courseService.getEnrolledCourses().subscribe(courses => {
      this.enrolledCourses = Array.from(courses);
      this.cdr.detectChanges();
    });
    this.assessmentService.getMyCertificates().subscribe(certs => {
      this.certificates = certs;
      this.cdr.detectChanges();
    });
  }

  calculateXpPercentage(): number {
    if (!this.user?.xp) return 0;
    return Math.min(((this.user.xp % 1000) / 1000) * 100, 100);
  }

  getNextLevelXp(): number {
    if (!this.user?.level) return 1000;
    return (this.user.level + 1) * 1000;
  }

  saveProfile(): void {
    this.userService.updateProfile(this.editData.fullName, this.editData.avatarUrl, this.editData.bio, this.editData.specialty).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        alert('¡Perfil profesional actualizado con éxito! 🏆');
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error al actualizar perfil')
    });
  }

  changePassword(): void {
    if (!this.securityData.oldPassword || !this.securityData.newPassword) {
      alert('Por favor completa ambos campos de contraseña.');
      return;
    }
    this.userService.changePassword(this.securityData.oldPassword, this.securityData.newPassword).subscribe({
      next: (res) => {
        alert(res.message);
        this.securityData = { oldPassword: '', newPassword: '' };
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error: ' + (err.error?.message || 'No se pudo cambiar la contraseña'))
    });
  }
}
