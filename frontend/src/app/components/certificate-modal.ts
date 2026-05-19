import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Certificate } from '../services/assessment.service';

@Component({
  selector: 'app-certificate-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cert-overlay" (click)="close.emit()">
      <div class="cert-container premium-card" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close.emit()">&times;</button>
        
        <div class="certificate-paper" id="printable-cert">
          <div class="cert-border">
            <div class="cert-content">
              <div class="cert-header">
                <div class="academy-logo">MASTERY</div>
                <h1>CERTIFICADO DE EXCELENCIA</h1>
                <p class="award-text">SE OTORGA EL PRESENTE RECONOCIMIENTO A:</p>
              </div>

              <div class="student-name gradient-text">
                {{ certificate?.user?.username || 'Estudiante de Élite' }}
              </div>

              <div class="cert-body">
                <p>Por haber completado satisfactoriamente el programa avanzado de:</p>
                <h2 class="course-name">{{ certificate?.course?.title }}</h2>
                <p class="details">Impartido por expertos institucionales y validado mediante evaluación técnica.</p>
              </div>

              <div class="cert-footer">
                <div class="signature">
                  <div class="sig-line"></div>
                  <span>Director de Academia</span>
                </div>
                <div class="seal">
                  <div class="seal-inner">VIP</div>
                </div>
                <div class="signature">
                  <div class="sig-line"></div>
                  <span>Instructor del Programa</span>
                </div>
              </div>

              <div class="cert-id">
                ID DE VALIDACIÓN: {{ certificate?.certificateCode }}<br>
                FECHA DE EMISIÓN: {{ certificate?.issuedAt | date:'longDate' }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-premium w-full" (click)="printCert()">🖨️ Descargar / Imprimir Certificado</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cert-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 3000;
      animation: fadeIn 0.4s ease;
    }
    .cert-container { width: 900px; padding: 2rem; position: relative; }
    
    .certificate-paper {
      background: #fff;
      color: #1a1a1a;
      padding: 10px;
      position: relative;
      box-shadow: 0 0 50px rgba(0,0,0,0.5);
      aspect-ratio: 1.414 / 1; /* A4 Horizontal */
    }

    .cert-border {
      border: 15px double var(--primary-gold);
      height: 100%;
      padding: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: radial-gradient(circle at center, #fff 0%, #fdfbf7 100%);
    }

    .academy-logo { font-weight: 900; letter-spacing: 5px; color: #444; margin-bottom: 1rem; }
    .cert-header h1 { font-family: 'Playfair Display', serif; font-size: 2.8rem; margin: 1rem 0; color: #1a1a1a; letter-spacing: 2px; }
    .award-text { font-style: italic; color: #666; margin-bottom: 2rem; }

    .student-name { font-size: 3.5rem; font-weight: 800; margin: 1rem 0; font-family: 'Dancing Script', cursive; }
    
    .cert-body { margin: 2rem 0; line-height: 1.6; }
    .course-name { font-size: 1.8rem; color: var(--primary-gold); margin: 1rem 0; font-weight: 800; }
    
    .cert-footer { 
      display: flex; justify-content: space-around; width: 100%; margin-top: 4rem; align-items: center;
    }
    .signature { display: flex; flex-direction: column; align-items: center; z-index: 2; }
    .sig-line { width: 180px; border-top: 2px solid #333; margin-bottom: 0.5rem; }
    .signature span { font-size: 0.8rem; font-weight: 700; color: #666; text-transform: uppercase; }

    .seal {
      position: absolute;
      bottom: 20px;
      right: 40px;
      width: 120px; height: 120px;
      background: var(--primary-gold);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
      border: 6px double #fff;
      transform: rotate(-15deg);
      z-index: 1;
      opacity: 0.9;
    }
    .seal-inner { font-weight: 900; color: #fff; font-size: 1.4rem; border: 2px solid #fff; padding: 8px; border-radius: 50%; }

    .cert-id { position: absolute; bottom: 1rem; left: 3rem; text-align: left; font-size: 0.6rem; color: #aaa; font-family: monospace; }

    .modal-actions { margin-top: 2.5rem; position: relative; z-index: 4000; }
    .modal-actions .btn-premium { padding: 1.2rem; font-size: 1.1rem; }
    
    @media print {
      @page { size: landscape; margin: 0; }
      body { background: white !important; }
      .cert-overlay { background: white !important; backdrop-filter: none; position: static; display: block; padding: 0; }
      .cert-container { width: 100%; max-width: none; padding: 0; box-shadow: none; margin: 0; }
      .close-btn, .modal-actions { display: none !important; }
      .certificate-paper { box-shadow: none; border: none; width: 100%; height: 100vh; padding: 0; }
      .cert-border { border-width: 25px; }
    }

    @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class CertificateModalComponent {
  @Input() certificate?: Certificate;
  @Output() close = new EventEmitter<void>();

  printCert() {
    window.print();
  }
}
