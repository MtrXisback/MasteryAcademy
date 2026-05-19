import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { AIService } from '../services/ai.service';
import { ChatMessage } from '../models/chat.model';
import { User } from '../models/auth.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-window premium-card">
      <div class="chat-header">
        <div class="user-info">
          <div class="avatar" [class.ai-avatar]="recipient?.id === 0">
            {{ recipient?.id === 0 ? '🤖' : recipient?.username?.substring(0,2)?.toUpperCase() }}
          </div>
          <div class="details">
            <span class="name">{{ recipient?.username }}</span>
            <span class="status" [class.ai-status]="recipient?.id === 0">
              {{ recipient?.id === 0 ? 'Copiloto Activo ⚡' : 'En línea ahora' }}
            </span>
          </div>
        </div>
        <button class="close-btn" (click)="closeChat()">&times;</button>
      </div>

      <div class="message-list" #scrollContainer>
        <div class="empty-state" *ngIf="messages.length === 0">
          <div class="empty-icon">💬</div>
          <p>{{ recipient?.id === 0 ? 'Hazme cualquier pregunta sobre trading o desarrollo.' : 'Inicia una conversación con tu mentor.' }}</p>
        </div>
        
        <div class="message-group" *ngFor="let msg of messages">
          <div class="message" [class.sent]="isSentByMe(msg)" [class.received]="!isSentByMe(msg)">
            <div class="bubble" [innerHTML]="formatMessage(msg.content)"></div>
            <div class="meta">
              {{ msg.timestamp | date:'shortTime' }}
              <span class="read-status" *ngIf="isSentByMe(msg)">{{ msg.read ? '✓✓' : '✓' }}</span>
            </div>
          </div>
        </div>

        <!-- TYPING INDICATOR -->
        <div class="message received" *ngIf="isLoadingAI" style="align-self: flex-start; max-width: 80%;">
          <div class="bubble typing-indicator-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>

      <div class="chat-footer">
        <textarea 
          [(ngModel)]="newMessage" 
          (keyup.enter)="sendMessage()" 
          placeholder="Escribe tu mensaje..."
          rows="1"
          [disabled]="isLoadingAI">
        </textarea>
        <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() || isLoadingAI">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-window {
      width: 390px;
      height: 520px;
      display: flex;
      flex-direction: column;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 1px solid var(--primary-gold);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .chat-header {
      padding: 1rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-glass);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }

    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { 
      width: 36px; height: 36px; border-radius: 50%; 
      background: var(--grad-gold); color: black;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.8rem;
    }
    .avatar.ai-avatar {
      background: linear-gradient(135deg, #111 0%, #3a321d 100%);
      border: 1px solid var(--primary-gold);
      font-size: 1.15rem;
    }
    .details { display: flex; flex-direction: column; }
    .name { font-weight: 700; color: white; font-size: 0.9rem; }
    .status { font-size: 0.65rem; color: #4ade80; font-weight: 600; }
    .status.ai-status { color: var(--primary-gold); text-shadow: 0 0 4px rgba(251, 191, 36, 0.4); }

    .message-list {
      flex-grow: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: rgba(0,0,0,0.25);
    }

    .message {
      max-width: 80%;
      display: flex;
      flex-direction: column;
    }
    .message.sent { align-self: flex-end; }
    .message.received { align-self: flex-start; }

    .bubble {
      padding: 0.75rem 1rem;
      border-radius: 16px;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .sent .bubble { background: var(--primary-gold); color: black; border-bottom-right-radius: 4px; }
    .received .bubble { background: rgba(255,255,255,0.04); color: #e5e7eb; border-bottom-left-radius: 4px; border: 1px solid var(--border-glass); }

    .meta {
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .sent .meta { justify-content: flex-end; }

    .chat-footer {
      padding: 1rem;
      background: var(--bg-card);
      border-top: 1px solid var(--border-glass);
      display: flex;
      gap: 0.75rem;
      align-items: center;
      border-radius: 0 0 12px 12px;
    }

    textarea {
      flex-grow: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 0.6rem 1rem;
      color: white;
      resize: none;
      font-family: inherit;
      font-size: 0.9rem;
    }
    textarea:focus { outline: none; border-color: var(--primary-gold); }

    .send-btn {
      background: var(--grad-gold);
      color: black;
      border: none;
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: 0.2s;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.1); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .empty-state {
      text-align: center; margin-top: 4rem; opacity: 0.5;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }

    /* Estilos Premium de Carga de IA */
    .typing-indicator-bubble {
      background: rgba(251, 191, 36, 0.06) !important;
      border: 1px solid rgba(251, 191, 36, 0.15) !important;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0.75rem 1.25rem !important;
    }
    .typing-dot {
      width: 6px;
      height: 6px;
      background-color: var(--primary-gold);
      border-radius: 50%;
      display: inline-block;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Estilos de Formateo de Markdown local */
    ::ng-deep .chat-h3 {
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary-gold);
      margin: 0.5rem 0 0.25rem 0;
      border-bottom: 1px solid rgba(251, 191, 36, 0.1);
      padding-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    ::ng-deep .chat-h4 {
      font-size: 0.88rem;
      font-weight: 700;
      color: white;
      margin: 0.5rem 0 0.25rem 0;
    }
    ::ng-deep .chat-inline-code {
      font-family: Consolas, Monaco, monospace;
      background: rgba(255, 255, 255, 0.08);
      color: #fca5a5;
      padding: 0.15rem 0.3rem;
      border-radius: 4px;
      font-size: 0.8rem;
      border: 1px solid rgba(255,255,255,0.03);
    }
    ::ng-deep .chat-bullet {
      margin-left: 0.5rem;
      margin-bottom: 0.25rem;
      color: #e5e7eb;
    }
    ::ng-deep .success {
      color: var(--success-green);
      font-weight: 700;
    }
    ::ng-deep .fail {
      color: var(--danger-red);
      font-weight: 700;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: var(--primary-gold-low); border-radius: 10px; }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() recipient?: User;
  @Input() courseId?: number;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoadingAI = false;
  private pollingSub?: Subscription;
  private shouldScrollToBottom = false;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  constructor(
    private chatService: ChatService,
    public authService: AuthService,
    private aiService: AIService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.recipient) {
      if (this.recipient.id === 0) {
        // Cargar historial persistente de la IA si existe para este usuario específico
        const username = this.authService.getUsername();
        const storageKey = username ? `ai_chat_history_${username}` : 'ai_chat_history_anonymous';
        const savedHistory = localStorage.getItem(storageKey);
        if (savedHistory) {
          this.messages = JSON.parse(savedHistory);
          this.shouldScrollToBottom = true;
        } else {
          // Inicializar con mensaje de bienvenida
          this.messages = [
            {
              id: 0,
              sender: this.recipient,
              recipient: { id: 999, username: username } as any,
              content: "### 🤖 ¡Saludos, Trader de Élite!\nSoy tu **Mastery Mentor AI**, tu copiloto de Inteligencia Artificial para trading institucional y tecnología avanzada de la academia.\n\nTengo acceso a tu ficha de estudiante en tiempo real. Escribe cualquier duda y operemos como profesionales. ⚡",
              timestamp: new Date().toISOString(),
              read: true
            }
          ];
          this.saveAIChatHistory();
          this.shouldScrollToBottom = true;
        }
      } else {
        this.loadHistory();
        // Polling cada 5 segundos para simular real-time sin WS con otros usuarios
        this.pollingSub = interval(5000).subscribe(() => this.loadHistory());
      }
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSub) this.pollingSub.unsubscribe();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadHistory(): void {
    if (!this.recipient) return;
    this.chatService.getHistory(this.recipient.id).subscribe(msgs => {
      if (msgs.length > this.messages.length) {
        this.shouldScrollToBottom = true;
      }
      this.messages = msgs;
      this.cdr.detectChanges();
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.recipient) return;

    if (this.recipient.id === 0) {
      const userText = this.newMessage;
      const userMsg: ChatMessage = {
        id: Date.now(),
        sender: { id: 999, username: this.authService.getUsername() } as any,
        recipient: this.recipient,
        content: userText,
        timestamp: new Date().toISOString(),
        read: true
      };
      this.messages.push(userMsg);
      this.newMessage = '';
      this.isLoadingAI = true;
      this.shouldScrollToBottom = true;
      this.saveAIChatHistory();
      this.cdr.detectChanges();

      this.aiService.sendMessage(userText, this.courseId).subscribe({
        next: (res) => {
          setTimeout(() => {
            this.isLoadingAI = false;
            const aiMsg: ChatMessage = {
              id: Date.now() + 1,
              sender: this.recipient!,
              recipient: { id: 999, username: this.authService.getUsername() } as any,
              content: res.response,
              timestamp: new Date().toISOString(),
              read: true
            };
            this.messages.push(aiMsg);
            this.shouldScrollToBottom = true;
            this.saveAIChatHistory();
            this.cdr.detectChanges();
          }, 1200); // 1.2 segundos de retraso "pensando" para visualización de carga premium
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoadingAI = false;
            const errorMsg: ChatMessage = {
              id: Date.now() + 1,
              sender: this.recipient!,
              recipient: { id: 999, username: this.authService.getUsername() } as any,
              content: "⚠️ **Error de Conexión**: No he podido comunicarme con mi cerebro central en el servidor. Por favor, asegúrate de que el backend de Spring Boot esté activo e inténtalo de nuevo.",
              timestamp: new Date().toISOString(),
              read: true
            };
            this.messages.push(errorMsg);
            this.shouldScrollToBottom = true;
            this.cdr.detectChanges();
          }, 1000);
        }
      });
    } else {
      this.chatService.sendMessage(this.recipient.id, this.newMessage, this.courseId).subscribe(msg => {
        this.messages.push(msg);
        this.newMessage = '';
        this.shouldScrollToBottom = true;
        this.cdr.detectChanges();
      });
    }
  }

  isSentByMe(msg: ChatMessage): boolean {
    return msg.sender.username === this.authService.getUsername();
  }

  saveAIChatHistory(): void {
    const username = this.authService.getUsername();
    const storageKey = username ? `ai_chat_history_${username}` : 'ai_chat_history_anonymous';
    localStorage.setItem(storageKey, JSON.stringify(this.messages));
  }

  formatMessage(content: string): string {
    if (!content) return '';
    let formatted = content;
    
    // Escapar caracteres html básicos para seguridad, pero conservar spans especiales
    formatted = formatted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Re-restaurar spans válidos de éxito/fallo inyectados por el AI Service
    formatted = formatted
      .replace(/&lt;span class="success"&gt;/g, '<span class="success">')
      .replace(/&lt;span class="fail"&gt;/g, '<span class="fail">')
      .replace(/&lt;\/span&gt;/g, '</span>');

    // Formatear cabeceras
    formatted = formatted.replace(/^### (.*$)/gim, '<div class="chat-h3">$1</div>');
    formatted = formatted.replace(/^#### (.*$)/gim, '<div class="chat-h4">$1</div>');
    
    // Negritas e Itálicas
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Código en línea
    formatted = formatted.replace(/`(.*?)`/g, '<code class="chat-inline-code">$1</code>');
    
    // Listas / Viñetas
    formatted = formatted.replace(/^- (.*$)/gim, '<div class="chat-bullet">• $1</div>');
    
    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) {}
  }

  closeChat(): void {
    (window as any).appComponent.closeChat();
  }
}

