import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, MessageRequest } from '../models/chat.model';
import { User } from '../models/auth.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/api/messages`;

  constructor(private http: HttpClient) {}

  sendMessage(recipientId: number, content: string, courseId?: number): Observable<ChatMessage> {
    const request: MessageRequest = { recipientId, content, courseId };
    return this.http.post<ChatMessage>(this.apiUrl, request);
  }

  getHistory(otherUserId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history/${otherUserId}`);
  }

  getContacts(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/contacts`);
  }

  markAsRead(senderId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${senderId}`, {});
  }
}
