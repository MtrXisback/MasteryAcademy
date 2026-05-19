import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) {}

  processCulqiPayment(token: string, amount: number, email: string, courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/culqi`, {
      token,
      amount,
      email,
      courseId
    });
  }
}
