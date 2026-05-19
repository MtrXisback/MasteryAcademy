import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private apiUrl = `${environment.apiUrl}/api/ai`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string, courseId?: number): Observable<{ response: string }> {
    // Recuperar datos actualizados del simulador de localStorage
    const balanceStr = localStorage.getItem('virtualBalance');
    const balance = balanceStr ? parseFloat(balanceStr) : 10000.00;

    const positionsStr = localStorage.getItem('activePositions');
    const positions = positionsStr ? JSON.parse(positionsStr) : [];

    const request = {
      message,
      balance,
      positions,
      courseId
    };

    return this.http.post<{ response: string }>(`${this.apiUrl}/chat`, request);
  }
}
