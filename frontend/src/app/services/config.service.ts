import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppConfig {
  googleClientId: string;
  githubClientId: string;
  culqiPublicKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<void> {
    try {
      console.log('💎 [ConfigService] Fetching dynamic environment configurations from backend...');
      this.config = await lastValueFrom(
        this.http.get<AppConfig>(`${environment.apiUrl}/api/config`)
      );
      console.log('✅ [ConfigService] Dynamic configurations successfully loaded.');
    } catch (err) {
      console.error('❌ [ConfigService] Failed to load remote configurations from backend, using safe local fallbacks:', err);
      // Operational fallback to avoid breaking the application UI
      this.config = {
        googleClientId: '906689031164-ohfj5ds96tcfmk33hug3jgn01q1iel8c.apps.googleusercontent.com',
        githubClientId: 'Ov23liTW9AkvWdeVAlzy',
        culqiPublicKey: 'pk_test_wJJMR9za3B38exQU'
      };
    }
  }

  get googleClientId(): string {
    return this.config?.googleClientId || '';
  }

  get githubClientId(): string {
    return this.config?.githubClientId || '';
  }

  get culqiPublicKey(): string {
    return this.config?.culqiPublicKey || '';
  }
}
