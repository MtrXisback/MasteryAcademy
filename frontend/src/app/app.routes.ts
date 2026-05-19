import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard';
import { HomeComponent } from './components/home';
import { ProfileComponent } from './components/profile';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'course/:id', loadComponent: () => import('./components/course-player').then(m => m.CoursePlayerComponent) },
  { path: 'course/:id/manage', loadComponent: () => import('./components/course-management').then(m => m.CourseManagementComponent) },
  { path: 'quiz/:courseId', loadComponent: () => import('./components/quiz').then(m => m.QuizComponent) },
  { path: 'admin/users', loadComponent: () => import('./components/admin-users').then(m => m.AdminUsersComponent) },
  { path: 'admin/news', loadComponent: () => import('./components/news-management').then(m => m.NewsManagementComponent) },
  { path: 'instructors', loadComponent: () => import('./components/instructors').then(m => m.InstructorsComponent) },
  { path: 'profile', component: ProfileComponent },
  { path: 'login', loadComponent: () => import('./components/auth').then(m => m.AuthComponent) },
  { path: 'register', loadComponent: () => import('./components/auth').then(m => m.AuthComponent) },
  { path: 'page/:type', loadComponent: () => import('./components/static-page').then(m => m.StaticPageComponent) },
  { path: '**', redirectTo: '' }
];
