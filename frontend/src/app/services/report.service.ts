import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReportType = 'ventas' | 'inscripciones' | 'estudiantes';
export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export interface ReportSummary {
  totalRevenue: number;
  totalEnrollments: number;
  totalPayments: number;
  totalCourses: number;
  totalStudents: number;
  revenueByMonth: { month: string; revenue: number }[];
  topCourses: { title: string; enrolled: number; revenue: number }[];
  generatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<ReportSummary> {
    return this.http.get<ReportSummary>(`${this.apiUrl}/summary`);
  }

  download(type: ReportType, format: ReportFormat, from?: string, to?: string): Observable<HttpResponse<Blob>> {
    let params = new HttpParams().set('format', format);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.apiUrl}/${type}`, { params, responseType: 'blob', observe: 'response' });
  }
}
