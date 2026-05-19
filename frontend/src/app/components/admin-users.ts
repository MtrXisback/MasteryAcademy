import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-users-page fade-in">
      <header class="admin-header">
        <div class="container">
          <h1 class="gradient-text">Gestión de Personal Mastery</h1>
          <p class="subtitle">Administra los rangos y la visibilidad de tu equipo de élite.</p>
        </div>
      </header>

      <div class="container mt-5">
        <div class="admin-card premium-card">
          <div class="table-actions">
            <div class="search-box">
              <input type="text" [(ngModel)]="searchTerm" placeholder="Buscar por nombre o correo...">
            </div>
            <div class="stats-mini">
              <span>Total Usuarios: <strong>{{ users.length }}</strong></span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="mastery-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol Actual</th>
                  <th>Destacado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers()">
                  <td>
                    <div class="user-info">
                      <img [src]="user.avatarUrl || 'assets/default-avatar.png'" class="avatar-sm">
                      <div class="details">
                        <span class="name">{{ user.fullName || user.username }}</span>
                        <span class="username">@{{ user.username }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="role-badge" [ngClass]="getRoleClass(user)">
                      {{ getRoleLabel(user) }}
                    </span>
                  </td>
                  <td>
                    <div class="toggle-container" (click)="toggleFeatured(user)">
                      <div class="toggle" [class.active]="user.featured"></div>
                      <span class="toggle-label">{{ user.featured ? 'SÍ' : 'NO' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn-action" (click)="changeRole(user, 'ROLE_INSTRUCTOR')" *ngIf="!isInstructor(user)" title="Promover a Instructor">🎓</button>
                      <button class="btn-action" (click)="changeRole(user, 'ROLE_STUDENT')" *ngIf="isInstructor(user)" title="Degradar a Estudiante">📖</button>
                      <button class="btn-action danger" (click)="deleteUser(user)" title="Eliminar Usuario">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-users-page { padding-bottom: 5rem; }
    .admin-header { padding: 4rem 0; background: linear-gradient(to bottom, rgba(212, 175, 55, 0.05), transparent); }
    .subtitle { color: var(--text-muted); }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    
    .table-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .search-box input { background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.75rem 1.5rem; color: white; width: 300px; }
    
    .mastery-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .mastery-table th { text-align: left; padding: 1.25rem; color: var(--primary-gold); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border-glass); }
    .mastery-table td { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .avatar-sm { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--primary-gold); }
    .details { display: flex; flex-direction: column; }
    .details .name { font-weight: 700; color: white; }
    .details .username { font-size: 0.75rem; color: var(--text-muted); }

    .role-badge { padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .role-student { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
    .role-instructor { background: rgba(212, 175, 55, 0.1); color: var(--primary-gold); border: 1px solid var(--primary-gold); }
    .role-admin { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; }

    .toggle-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .toggle { width: 36px; height: 18px; background: #333; border-radius: 20px; position: relative; transition: 0.3s; }
    .toggle::after { content: ''; position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: 0.3s; }
    .toggle.active { background: var(--primary-gold); }
    .toggle.active::after { left: 20px; }
    .toggle-label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }

    .actions { display: flex; gap: 0.5rem; }
    .btn-action { background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
    .btn-action:hover { border-color: var(--primary-gold); background: var(--primary-gold-low); transform: scale(1.1); }
    .btn-action.danger:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }

    .table-responsive { overflow-x: auto; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe(data => {
      this.users = data;
      this.cdr.detectChanges();
    });
  }

  filteredUsers(): any[] {
    return this.users.filter(u => 
      u.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      u.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRoleLabel(user: any): string {
    const roles = user.roles.map((r: any) => r.name);
    if (roles.includes('ROLE_ADMIN')) return 'Administrador';
    if (roles.includes('ROLE_INSTRUCTOR')) return 'Instructor';
    return 'Estudiante';
  }

  getRoleClass(user: any): string {
    const roles = user.roles.map((r: any) => r.name);
    if (roles.includes('ROLE_ADMIN')) return 'role-admin';
    if (roles.includes('ROLE_INSTRUCTOR')) return 'role-instructor';
    return 'role-student';
  }

  isInstructor(user: any): boolean {
    return user.roles.map((r: any) => r.name).includes('ROLE_INSTRUCTOR');
  }

  changeRole(user: any, role: string): void {
    if (confirm(`¿Estás seguro de cambiar el rol de ${user.username} a ${role}?`)) {
      this.userService.updateUserRole(user.id, role).subscribe({
        next: () => {
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => alert('Error al actualizar rol')
      });
    }
  }

  toggleFeatured(user: any): void {
    const newState = !user.featured;
    this.userService.toggleFeatured(user.id, newState).subscribe({
      next: () => {
        user.featured = newState;
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error al actualizar estado destacado')
    });
  }

  deleteUser(user: any): void {
    if (confirm(`¿ELIMINAR PERMANENTEMENTE a ${user.username}? Esta acción no se puede deshacer.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (err) => alert('Error al eliminar usuario')
      });
    }
  }
}
