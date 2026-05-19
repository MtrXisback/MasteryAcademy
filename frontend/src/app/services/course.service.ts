import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Course } from '../models/course.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/api/courses`;

  constructor(private http: HttpClient) {}

  getCourses(title?: string, categoryId?: number, level?: string, instructorId?: number, page: number = 0, size: number = 10): Observable<Course[]> {
    let params: any = { page: page.toString(), size: size.toString() };
    if (title) params.title = title;
    if (categoryId) params.categoryId = categoryId;
    if (instructorId) params.instructorId = instructorId;
    if (level && level !== 'All') params.level = level;
    
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => response.content ? response.content : response)
    );
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, course);
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  enrollCourse(courseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${courseId}/enroll`, {});
  }

  getEnrolledCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/enrolled`);
  }

  getCourseContent(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}/content`);
  }

  // Content Management
  addModule(courseId: number, module: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/content/courses/${courseId}/modules`, module);
  }

  deleteModule(moduleId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/content/modules/${moduleId}`);
  }

  addLesson(moduleId: number, lesson: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/content/modules/${moduleId}/lessons`, lesson);
  }

  deleteLesson(lessonId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/content/lessons/${lessonId}`);
  }

  // Progress Tracking
  completeLesson(lessonId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/progress/lessons/${lessonId}/complete`, {});
  }

  getCourseProgress(courseId: number): Observable<number[]> {
    return this.http.get<number[]>(`${environment.apiUrl}/api/progress/courses/${courseId}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
