import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id?: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    username: string;
  };
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/api/reviews`;

  constructor(private http: HttpClient) {}

  getReviews(courseId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/course/${courseId}`);
  }

  getAverageRating(courseId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/course/${courseId}/average`);
  }

  addReview(courseId: number, rating: number, comment: string): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/course/${courseId}`, { rating, comment });
  }
}
