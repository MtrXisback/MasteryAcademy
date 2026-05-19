import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, { username, password }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  googleLogin(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { token }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  githubLogin(code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/github`, { token: code }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(username: string, email: string, password: string, role: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { username, email, password, role });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.roles.includes('ROLE_ADMIN') || false;
  }

  isInstructor(): boolean {
    const roles = this.currentUserSubject.value?.roles || [];
    return roles.includes('ROLE_INSTRUCTOR');
  }

  isStudent(): boolean {
    const roles = this.currentUserSubject.value?.roles || [];
    return roles.includes('ROLE_STUDENT') && !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_INSTRUCTOR');
  }

  getUsername(): string {
    return this.currentUserSubject.value?.username || '';
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id || null;
  }

  refreshCurrentUser(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/users/me`).pipe(
      tap(user => {
        const current = this.currentUserSubject.value;
        if (current) {
          const updatedUser: AuthResponse = {
            ...current,
            xp: user.xp,
            level: user.level,
            email: user.email,
            username: user.username,
            roles: user.roles ? user.roles.map((r: any) => r.name || r) : current.roles
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }
}
