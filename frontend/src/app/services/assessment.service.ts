import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Quiz {
  id?: number;
  title: string;
  description: string;
  passingScore: number;
  questions: Question[];
}

export interface Question {
  id?: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Certificate {
  id: number;
  certificateCode: string;
  course: { title: string };
  user: { username: string };
  issuedAt: string;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private apiUrl = `${environment.apiUrl}/api/assessments`;

  constructor(private http: HttpClient) {}

  getQuizByCourse(courseId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/quiz/course/${courseId}`);
  }

  saveQuiz(courseId: number, quiz: Quiz): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.apiUrl}/${courseId}`, quiz);
  }

  submitQuiz(quizId: number, answers: number[]): Observable<{ passed: boolean }> {
    return this.http.post<{ passed: boolean }>(`${this.apiUrl}/quiz/${quizId}/submit`, answers);
  }

  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/certificates`);
  }
}
