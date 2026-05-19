import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, filter } from 'rxjs';
import { CourseService } from './services/course.service';
import { CategoryService } from './services/category.service';
import { AuthService } from './services/auth.service';
import { NotificationService, Notification } from './services/notification.service';
import { Course } from './models/course.model';
import { Category } from './models/category.model';
import { User } from './models/auth.model';
import { PaymentComponent } from './components/payment';
import { ChatWindowComponent } from './components/chat-window';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, PaymentComponent, ChatWindowComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  courses: Course[] = [];
  categories: Category[] = [];
  notifications: Notification[] = [];
  activeToast: Notification | null = null;
  unreadCount = 0;
  activeNotifTab: 'student' | 'academy' = 'student';
  
  // Modales
  showModal = false;
  showCheckout = false;
  isEditing = false;
  showNotifications = false;
  showChat = false;
  courseToBuy?: Course;
  chatRecipient?: any;
  chatCourseId?: number;
  
  authData = {
    username: '',
    password: ''
  };

  currentCourse: Course = this.getEmptyCourse();

  constructor(
    private courseService: CourseService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    public authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    (window as any).appComponent = this;
    this.loadCourses();
    this.loadCategories();
    this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.updateUnreadCount();
    });
    this.notificationService.toast$.subscribe(toast => {
      this.activeToast = toast;
      this.cdr.detectChanges();
    });

    // Iniciar Polling de Notificaciones cada 10s
    interval(10000).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        this.notificationService.loadNotifications();
        this.cdr.detectChanges(); // Forzar renderizado para evitar retraso visual
      }
    });

    // Auto Scroll to Top en cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  updateUnreadCount(): void {
    if (!this.authService.isLoggedIn()) {
      this.unreadCount = 0;
      return;
    }
    this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
      this.cdr.detectChanges();
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  getActiveNotifications(): Notification[] {
    return this.notifications.filter(n => {
      if (this.activeNotifTab === 'student') {
        return !n.roleTarget || n.roleTarget === 'ROLE_STUDENT';
      } else {
        return n.roleTarget === 'ROLE_INSTRUCTOR' || n.roleTarget === 'ROLE_ADMIN';
      }
    });
  }

  getTabUnreadCount(tab: 'student' | 'academy'): number {
    return this.notifications.filter(n => !n.read && (
      tab === 'student' 
        ? (!n.roleTarget || n.roleTarget === 'ROLE_STUDENT') 
        : (n.roleTarget === 'ROLE_INSTRUCTOR' || n.roleTarget === 'ROLE_ADMIN')
    )).length;
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  markRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats;
    });
  }

  openChat(recipient: any, courseId?: number): void {
    this.chatRecipient = recipient;
    this.chatCourseId = courseId;
    this.showChat = true;
    this.cdr.detectChanges();
  }

  openAICopilot(): void {
    const aiContact = {
      id: 0,
      username: 'Mastery Mentor AI',
      specialty: 'Trading Copilot & Mentor AI 🤖⚡',
      bio: 'Asistente de inteligencia artificial contextualmente entrenado en trading de precisión y desarrollo.',
      featured: true
    };
    this.openChat(aiContact);
  }

  closeChat(): void {
    this.showChat = false;
    this.cdr.detectChanges();
  }

  getEmptyCourse(): Course {
    return {
      title: '',
      description: '',
      instructor: '',
      price: 0,
      category: undefined,
      level: 'BEGINNER',
      duration: 0
    };
  }

  compareCategories(c1: Category, c2: Category): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.courses.forEach((c, index) => {
          if (!c.imageUrl) {
            const defaults = ['course_institutional.png', 'course_crypto.png', 'course_mindset.png'];
            c.imageUrl = `/assets/${defaults[index % 3]}`;
          }
        });
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando cursos', err)
    });
  }

  openCreateModal(): void {
    this.currentCourse = this.getEmptyCourse();
    this.isEditing = false;
    this.showModal = true;
  }

  openEditModal(course: Course): void {
    this.currentCourse = { ...course };
    this.isEditing = true;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCourse(): void {
    if (this.isEditing && this.currentCourse.id) {
      this.courseService.updateCourse(this.currentCourse.id, this.currentCourse).subscribe({
        next: () => {
          this.loadCourses();
          this.closeModal();
        },
        error: (err) => console.error('Error actualizando curso', err)
      });
    } else {
      this.courseService.createCourse(this.currentCourse).subscribe({
        next: () => {
          this.loadCourses();
          this.closeModal();
        },
        error: (err) => console.error('Error creando curso', err)
      });
    }
  }

  deleteCourse(id?: number): void {
    if (id && confirm('¿Estás seguro de eliminar este curso?')) {
      this.courseService.deleteCourse(id).subscribe({
        next: () => this.loadCourses(),
        error: (err) => console.error('Error eliminando curso', err)
      });
    }
  }


  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }

  scrollToCourses(): void {
    const element = document.getElementById('courses-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Payment Logic
  openCheckout(course: Course): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.courseToBuy = course;
    this.showCheckout = true;
  }

  handlePaymentSuccess(): void {
    if (this.courseToBuy?.id) {
      this.showCheckout = false;
      alert('¡Pago procesado con éxito! Bienvenido al programa.');
      window.location.reload(); // Recargar para actualizar estado
    }
  }
}
