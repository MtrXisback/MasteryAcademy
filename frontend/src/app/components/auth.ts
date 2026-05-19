import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SocialAuthService, GoogleLoginProvider, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  template: `
    <div class="auth-page fade-in">
      <div class="auth-split">
        <!-- Lado Visual -->
        <div class="auth-visual">
          <img src="/assets/login_bg.png" alt="Login Background" class="bg-img">
          <div class="visual-overlay">
            <div class="visual-content">
              <span class="badge">MASTERY TERMINAL</span>
              <h1>Domina el Mercado <br>con <span class="gradient-text">Inteligencia.</span></h1>
              <p>Accede a herramientas exclusivas, análisis en tiempo real y la comunidad de traders más avanzada del mundo.</p>
              
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">15k+</span>
                  <span class="stat-label">Alumnos</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">98%</span>
                  <span class="stat-label">Satisfechos</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">24/7</span>
                  <span class="stat-label">Soporte</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado Formulario -->
        <div class="auth-form-container">
          <div class="form-box">
            <div class="form-header">
              <a routerLink="/" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Volver al Inicio
              </a>
              <h1 class="brand-title gradient-text">MASTERY ACADEMY</h1>
              <h2>{{ isLoginMode ? 'Bienvenido de Nuevo' : 'Únete a la Élite' }}</h2>
              <p>{{ isLoginMode ? 'Ingresa tus credenciales para acceder a tu terminal.' : 'Crea tu cuenta y comienza tu camino hoy mismo.' }}</p>
            </div>

            <form (ngSubmit)="handleAuth()" #authForm="ngForm" class="premium-form">
              <div class="form-group">
                <label>Nombre de Usuario</label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <input type="text" [(ngModel)]="authData.username" name="username" required placeholder="tu_usuario">
                </div>
              </div>

              <div class="form-group" *ngIf="!isLoginMode">
                <label>Correo Electrónico</label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <input type="email" [(ngModel)]="authData.email" name="email" required placeholder="correo@ejemplo.com">
                </div>
              </div>

              <div class="form-group">
                <label>Contraseña</label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input type="password" [(ngModel)]="authData.password" name="password" required placeholder="••••••••">
                </div>
              </div>

              <div class="form-options" *ngIf="isLoginMode">
                <label class="checkbox-container">
                  <input type="checkbox">
                  <span class="checkmark"></span>
                  Recordarme
                </label>
                <a href="#" class="forgot-pwd">¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" class="btn-premium w-full auth-submit" [disabled]="!authForm.form.valid">
                {{ isLoginMode ? 'Iniciar Sesión' : 'Registrarse Ahora' }}
              </button>

              <div class="social-login">
                <span class="divider-text">O continúa con</span>
                <div class="social-btns">
                  <div class="social-btn-google">
                    <asl-google-signin-button type="icon" size="large" theme="filled_black" shape="square"></asl-google-signin-button>
                  </div>
                  <button type="button" class="social-btn github" (click)="signInWithGithub()"><img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="Github"></button>
                </div>
              </div>
            </form>

            <div class="form-footer">
              <p>
                {{ isLoginMode ? '¿Nuevo en la academia?' : '¿Ya eres miembro?' }}
                <a (click)="toggleMode()">{{ isLoginMode ? 'Crea una cuenta gratuita' : 'Inicia sesión aquí' }}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; width: 100%; background: var(--bg-dark); overflow-x: hidden; display: flex; flex-direction: column; }
    .auth-split { display: flex; flex: 1; min-height: 100vh; }

    /* Lado Visual */
    .auth-visual { flex: 1.2; position: relative; overflow: hidden; display: flex; align-items: center; padding: 4rem; }
    .bg-img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6) contrast(1.1); }
    .visual-overlay { position: relative; z-index: 2; color: white; max-width: 600px; }
    .visual-content h1 { font-size: 3.5rem; line-height: 1.1; margin: 1.5rem 0; font-weight: 800; }
    .visual-content p { font-size: 1.1rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 3rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: var(--primary-gold); }
    .stat-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.5); }

    /* Lado Formulario */
    .auth-form-container { flex: 1; background: #0a0a0a; display: flex; align-items: center; justify-content: center; padding: 2rem; border-left: 1px solid var(--border-glass); }
    .form-box { width: 100%; max-width: 420px; }
    
    .form-header { margin-bottom: 2.5rem; }
    .brand-title { font-size: 1.2rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 0.5rem; }
    .back-link { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); text-decoration: none; margin-bottom: 2rem; transition: 0.3s; }
    .back-link:hover { color: white; }
    .form-header h2 { font-size: 2rem; color: white; margin-bottom: 0.5rem; }
    .form-header p { color: var(--text-muted); font-size: 0.95rem; }

    .premium-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .form-group label { font-size: 0.8rem; color: var(--primary-gold); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); }
    .input-wrapper input {
      width: 100%;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 1.1rem 1rem 1.1rem 3.2rem;
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    .input-wrapper input:focus {
      border-color: var(--primary-gold);
      background: rgba(255,255,255,0.05);
      outline: none;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.08);
      transform: scale(1.01);
    }

    .form-options { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
    .forgot-pwd { color: var(--primary-gold); text-decoration: none; font-weight: 600; }
    
    .auth-submit { padding: 1.25rem; font-size: 1rem; font-weight: 700; border-radius: 12px; margin-top: 1rem; }

    .social-login { margin-top: 2rem; text-align: center; }
    .divider-text { display: flex; align-items: center; color: rgba(255,255,255,0.2); font-size: 0.75rem; text-transform: uppercase; gap: 1rem; margin-bottom: 1.5rem; }
    .divider-text::before, .divider-text::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
    
    .social-btns { display: flex; gap: 1.5rem; justify-content: center; margin-top: 1rem; align-items: center; }
    
    .social-btn-google {
      width: 44px;
      height: 44px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: 0.3s;
    }
    .social-btn-google:hover { transform: translateY(-2px); }

    .social-btn {
      background: #000000;
      border: 1px solid rgba(255,255,255,0.1);
      width: 44px;
      height: 44px;
      border-radius: 4px; /* Matches Google's default icon radius */
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .social-btn:hover { 
      border-color: var(--primary-gold);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.4);
    }
    .social-btn img { width: 22px; height: 22px; opacity: 0.8; transition: 0.3s; }
    .social-btn.github img { filter: invert(1) brightness(1.5); }
    .social-btn:hover img { opacity: 1; transform: scale(1.1); }

    /* Forcing Google button to fill the whole container and be clickable everywhere */
    ::ng-deep asl-google-signin-button {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }
    ::ng-deep asl-google-signin-button > div {
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
    }
    ::ng-deep .S93Sbe { 
      background-color: #000000 !important; 
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 4px !important;
      box-shadow: none !important;
    }
    ::ng-deep .S93Sbe:hover {
      border-color: var(--primary-gold) !important;
    }
    ::ng-deep .nsm7Bb-HzV7m-LgbsSe {
      background-color: #000000 !important;
      border-radius: 4px !important;
    }
    ::ng-deep .nsm7Bb-HzV7m-LgbsSe:hover {
      border-color: var(--primary-gold) !important;
    }

    .form-footer { margin-top: 2.5rem; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
    .form-footer a { color: white; font-weight: 700; cursor: pointer; margin-left: 0.5rem; }
    .form-footer a:hover { text-decoration: underline; }

    /* Checkbox Custom */
    .checkbox-container { display: flex; align-items: center; cursor: pointer; color: var(--text-muted); }
    .checkbox-container input { display: none; }
    .checkmark { width: 18px; height: 18px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; margin-right: 10px; position: relative; }
    .checkbox-container input:checked ~ .checkmark { background: var(--primary-gold); border-color: var(--primary-gold); }
    .checkbox-container input:checked ~ .checkmark::after { content: "✓"; position: absolute; color: black; font-size: 12px; left: 3px; top: 0px; }

    @media (max-width: 1024px) {
      .auth-visual { display: none; }
      .auth-form-container { flex: 1; }
    }
  `]
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  authData = { username: '', email: '', password: '', role: ['student'] };

  constructor(
    private authService: AuthService, 
    private socialAuthService: SocialAuthService,
    private router: Router,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
    if (this.router.url.includes('register')) {
      this.isLoginMode = false;
    }

    // Escuchar el estado de autenticación social (Google)
    this.socialAuthService.authState.subscribe((user) => {
      if (user && user.idToken) {
        this.authService.googleLogin(user.idToken).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err) => alert('Error con Google Login: ' + (err.error?.message || 'Error de conexión'))
        });
      }
    });

    // Detectar código de GitHub en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const githubCode = urlParams.get('code');
    if (githubCode) {
      this.authService.githubLogin(githubCode).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => alert('Error con GitHub Login: ' + (err.error?.message || 'Error de conexión'))
      });
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
  }

  signInWithGithub(): void {
    const clientId = this.configService.githubClientId;
    const redirectUri = 'http://localhost:4200/login';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  }

  handleAuth(): void {
    if (this.isLoginMode) {
      this.authService.login(this.authData.username, this.authData.password).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => alert('Error: ' + (err.error?.message || 'Credenciales inválidas'))
      });
    } else {
      this.authService.register(this.authData.username, this.authData.email, this.authData.password, this.authData.role).subscribe({
        next: () => {
          alert('¡Registro exitoso! Ya puedes iniciar sesión.');
          this.isLoginMode = true;
        },
        error: (err) => alert('Error: ' + (err.error?.message || 'Datos inválidos'))
      });
    }
  }
}
