import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course } from '../models/course.model';
import { PaymentService } from '../services/payment.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

declare var CulqiJS: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="checkout-overlay" (click)="onCancel()">
      <div class="checkout-card premium-card" (click)="$event.stopPropagation()">
        <div class="checkout-header">
          <h2 class="gradient-text">Finalizar Inscripción VIP</h2>
          <p class="subtitle">Estás a un paso de dominar los mercados.</p>
        </div>

        <div class="checkout-body" *ngIf="!paymentDone">
          <!-- Status Indicator for Culqi Loading -->
          <div class="engine-status" *ngIf="!engineReady && !isProcessing">
             <div class="loader-sm"></div>
             <span>Encendiendo motor de pagos VIP...</span>
          </div>

          <!-- Resumen del Pedido -->
          <div class="order-summary" *ngIf="engineReady || isProcessing">
            <div class="course-brief">
              <span class="label">Programa:</span>
              <span class="value">{{ course?.title }}</span>
            </div>
            <div class="course-brief total">
              <span class="label">Total a Pagar:</span>
              <span class="value">\${{ course?.price }}</span>
            </div>
          </div>

          <!-- Formulario de Tarjeta -->
          <div class="payment-form" *ngIf="engineReady || isProcessing">
            <div class="card-visual" [class]="getCardType()">
              <div class="card-header">
                <div class="chip"></div>
                <div class="card-brand">{{ getCardType() | uppercase }}</div>
              </div>
              <div class="card-number">{{ cardNumber || '•••• •••• •••• ••••' }}</div>
              <div class="card-footer">
                <div class="footer-item">
                  <span class="label">Titular</span>
                  <span class="holder">{{ cardHolder || 'TU NOMBRE AQUÍ' }}</span>
                </div>
                <div class="footer-item">
                  <span class="label">Expira</span>
                  <span class="expiry">{{ expiry || 'MM/AA' }}</span>
                </div>
              </div>
            </div>

            <div class="inputs-grid">
              <div class="form-group full">
                <label>Número de Tarjeta</label>
                <input type="text" [(ngModel)]="cardNumber" (input)="formatCardNumber()" placeholder="4532 8765 0981 2234" maxlength="19">
              </div>
              <div class="form-group full">
                <label>Nombre en la Tarjeta</label>
                <input type="text" [(ngModel)]="cardHolder" placeholder="JUAN PÉREZ">
              </div>
              <div class="form-group">
                <label>Expiración</label>
                <input type="text" [(ngModel)]="expiry" (input)="formatExpiry()" placeholder="MM/AA" maxlength="5">
              </div>
              <div class="form-group">
                <label>CVC</label>
                <input type="password" [(ngModel)]="cvc" placeholder="•••" maxlength="3">
              </div>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div class="success-state" *ngIf="paymentDone">
          <div class="success-icon">🏆</div>
          <h2>¡Pago Confirmado!</h2>
          <p>Bienvenido a la red de traders Mastery.</p>
          <div class="order-details premium-card">
            <p>Monto: \${{ course?.price }}</p>
            <p>Estado: Procesado por Culqi</p>
          </div>
          <p class="redirecting">Activando tu acceso al programa...</p>
        </div>

        <div class="checkout-footer" *ngIf="!paymentDone">
          <div class="security-info" *ngIf="engineReady">
            <span class="icon">🔒</span>
            <span>Pago seguro procesado por CulqiJS 🇵🇪</span>
          </div>
          
          <button class="btn-premium w-full mt-4" (click)="onPay()" [disabled]="isProcessing || !isValid() || !engineReady">
            <span *ngIf="!isProcessing">Confirmar Pago Seguro</span>
            <span *ngIf="isProcessing" class="loader-text">Generando Token...</span>
          </button>
          
          <button class="btn-cancel" (click)="onCancel()" [disabled]="isProcessing">Cancelar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); backdrop-filter: blur(20px);
      display: flex; align-items: center; justify-content: center; z-index: 2000;
      padding: 15px; animation: fadeIn 0.3s ease;
    }
    .checkout-card { 
      width: 100%; max-width: 440px; padding: 1.25rem; position: relative; 
      background: var(--bg-deep); border-radius: 20px;
      border: 1px solid var(--border-glass); box-shadow: 0 30px 60px rgba(0,0,0,0.6);
    }
    
    .checkout-header { text-align: center; margin-bottom: 0.75rem; }
    .checkout-header h2 { font-size: 1.25rem; margin: 0; }
    .subtitle { color: var(--text-muted); font-size: 0.75rem; margin-top: 0.1rem; }

    .engine-status {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
      padding: 2rem; color: var(--text-muted); font-size: 0.9rem;
    }

    .order-summary { 
      background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass);
      padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem;
    }
    .course-brief { display: flex; justify-content: space-between; margin-bottom: 0.2rem; font-size: 0.8rem; }
    .course-brief.total { border-top: 1px solid var(--border-glass); margin-top: 0.4rem; padding-top: 0.4rem; font-weight: 800; font-size: 0.95rem; color: var(--primary-gold); }

    .card-visual {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      height: 140px; border-radius: 14px; padding: 1rem;
      display: flex; flex-direction: column; justify-content: space-between;
      margin-bottom: 1.25rem; border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      transition: all 0.5s ease;
    }
    .card-visual.visa { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border-color: #3b82f6; }
    .card-visual.mastercard { background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); border-color: #ef4444; }

    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-brand { font-weight: 900; font-style: italic; font-size: 0.8rem; opacity: 0.7; letter-spacing: 1px; }

    .chip { width: 34px; height: 24px; background: linear-gradient(135deg, #d4af37 0%, #f1c40f 100%); border-radius: 4px; }

    .card-number { font-size: 1.1rem; font-family: 'Courier New', monospace; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center; }
    .card-footer { display: flex; justify-content: space-between; }
    .footer-item { display: flex; flex-direction: column; }
    .footer-item .label { font-size: 0.45rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .footer-item span:not(.label) { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }

    .inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .form-group.full { grid-column: span 2; }
    .form-group label { display: block; font-size: 0.6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.2rem; }
    .form-group input { background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); padding: 0.5rem 0.75rem; border-radius: 6px; color: white; width: 100%; transition: 0.3s; font-size: 0.85rem; }
    .form-group input:focus { border-color: var(--primary-gold); outline: none; background: rgba(0,0,0,0.5); }

    .success-state { text-align: center; padding: 1rem 0; }
    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; display: block; filter: drop-shadow(0 0 15px var(--primary-gold)); }
    .order-details { padding: 0.75rem; margin: 1rem 0; background: rgba(255,255,255,0.02); }
    .order-details p { margin: 0.15rem 0; font-size: 0.8rem; color: var(--text-muted); }

    .security-info { display: flex; align-items: center; justify-content: center; gap: 0.3rem; font-size: 0.65rem; color: var(--success-green); margin-top: 0.75rem; }
    .btn-cancel { background: none; border: none; color: var(--text-muted); width: 100%; margin-top: 0.5rem; cursor: pointer; font-size: 0.8rem; }
    
    .btn-premium { padding: 0.7rem; font-size: 0.85rem; border-radius: 10px; font-weight: 800; }

    .loader-sm {
      border: 2px solid rgba(255,255,255,0.1); border-top: 2px solid var(--primary-gold);
      border-radius: 50%; width: 20px; height: 20px; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class PaymentComponent implements OnInit {
  @Input() course?: Course;
  @Output() paymentSuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  cardNumber = '';
  cardHolder = '';
  expiry = '';
  cvc = '';
  isProcessing = false;
  paymentDone = false;
  engineReady = false;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    console.log('[CulqiJS] Iniciando carga de motor especializado...');
    this.initEngine();
  }

  initEngine() {
    // Implementación Dual-Engine: Usamos API REST directa de Culqi para mayor velocidad
    // y bypass de bloqueos de scripts externos en navegadores estrictos.
    console.log('✅ [Culqi REST] Motor de tokenización directo listo para operar con el formulario VIP.');
    this.engineReady = true;
  }

  getCardType(): string {
    if (this.cardNumber.startsWith('4')) return 'visa';
    if (this.cardNumber.startsWith('5')) return 'mastercard';
    return '';
  }

  formatCardNumber() {
    let val = this.cardNumber.replace(/\D/g, '');
    let chunks = val.match(/.{1,4}/g);
    this.cardNumber = chunks ? chunks.join(' ') : val;
  }

  formatExpiry() {
    let val = this.expiry.replace(/\D/g, '');
    if (val.length > 2) {
      this.expiry = val.substring(0, 2) + '/' + val.substring(2, 4);
    } else {
      this.expiry = val;
    }
  }

  isValid(): boolean {
    return this.cardNumber.replace(/\s+/g, '').length >= 16 && this.cardHolder.length > 3 && this.expiry.length === 5 && this.cvc.length >= 3;
  }

  async onPay() {
    if (!this.isValid() || !this.engineReady) return;
    this.isProcessing = true;

    const expiryParts = this.expiry.split('/');
    const month = parseInt(expiryParts[0]);
    const year = parseInt('20' + expiryParts[1]);
    const email = (this.authService as any).currentUserSubject.value?.email || 'test@mastery.com';

    console.log('[Culqi REST] Generando token seguro desde el formulario VIP...');

    try {
      const response = await fetch('https://secure.culqi.com/v2/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.configService.culqiPublicKey
        },
        body: JSON.stringify({
          card_number: this.cardNumber.replace(/\s+/g, ''),
          cvv: this.cvc,
          expiration_month: month,
          expiration_year: year,
          email: email
        })
      });

      const data = await response.json();

      if (response.ok && data.id) {
        console.log('💎 [Culqi REST] Token generado con éxito:', data.id);
        this.executeCharge(data.id);
      } else {
        throw data;
      }
    } catch (error: any) {
      this.isProcessing = false;
      console.error('❌ [Culqi REST] Error:', error);
      const msg = error.user_message || error.merchant_message || error.message || 'Error en los datos de la tarjeta.';
      alert('Aviso Culqi: ' + msg);
    }
  }

  executeCharge(token: string) {
    if (!this.course) return;

    const amountInCents = Math.round((this.course.price || 0) * 100);
    const email = (this.authService as any).currentUserSubject.value?.email || 'test@mastery.com';

    this.paymentService.processCulqiPayment(token, amountInCents, email, this.course.id!).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.paymentDone = true;
        setTimeout(() => {
          this.paymentSuccess.emit();
        }, 3000);
      },
      error: (err) => {
        this.isProcessing = false;
        alert('Error en cargo: ' + (err.error?.message || 'Fallo en el servidor de pagos.'));
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
