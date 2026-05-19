import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  id?: number;
  content: string;
  createdAt: string;
  user: {
    username: string;
  };
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private apiUrl = `${environment.apiUrl}/api/comments`;

  constructor(private http: HttpClient) {}

  getComments(lessonId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/lesson/${lessonId}`);
  }

  addComment(lessonId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/lesson/${lessonId}`, content);
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
