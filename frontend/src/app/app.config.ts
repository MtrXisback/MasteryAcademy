import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

import { SOCIAL_AUTH_CONFIG, GoogleLoginProvider, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { ConfigService } from './services/config.service';

export function initializeApp(configService: ConfigService) {
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: SOCIAL_AUTH_CONFIG,
      useFactory: (configService: ConfigService) => {
        return {
          autoLogin: false,
          providers: [
            {
              id: GoogleLoginProvider.PROVIDER_ID,
              provider: new GoogleLoginProvider(configService.googleClientId)
            }
          ],
          onError: (err) => console.error(err)
        } as SocialAuthServiceConfig;
      },
      deps: [ConfigService]
    }
  ]
};
