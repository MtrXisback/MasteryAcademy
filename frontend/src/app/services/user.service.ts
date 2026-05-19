import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  getFeaturedInstructors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/role`, { role });
  }

  toggleFeatured(userId: number, featured: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/featured`, { featured });
  }

  updateProfile(fullName: string, avatarUrl: string, bio?: string, specialty?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, { fullName, avatarUrl, bio, specialty });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/password`, { oldPassword, newPassword });
  }
  
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
