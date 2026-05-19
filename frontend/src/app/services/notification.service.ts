import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'MESSAGE' | 'ACHIEVEMENT';
  roleTarget?: 'ROLE_STUDENT' | 'ROLE_INSTRUCTOR' | 'ROLE_ADMIN' | null;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private toastSubject = new BehaviorSubject<Notification | null>(null);
  public toast$ = this.toastSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadNotifications(): void {
    this.http.get<Notification[]>(this.apiUrl).subscribe(notifs => {
      // Si hay nuevas notificaciones (comparando IDs), mostrar toast para la más reciente
      const currentNotifs = this.notificationsSubject.value;
      if (notifs.length > currentNotifs.length) {
        const newest = notifs[0];
        if (!newest.read) this.showToast(newest);
      }
      this.notificationsSubject.next(notifs);
    });
  }

  showToast(notif: Notification): void {
    this.toastSubject.next(notif);
    setTimeout(() => this.toastSubject.next(null), 5000);
  }

  markAsRead(id: number): void {
    this.http.put(`${this.apiUrl}/${id}/read`, {}).subscribe(() => {
      const updated = this.notificationsSubject.value.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      this.notificationsSubject.next(updated);
    });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{count: number}>(`${this.apiUrl}/unread-count`).pipe(
      map(res => res.count)
    );
  }
}
