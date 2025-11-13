// app.config.ts
import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { provideNzIcons } from './icons-provider';
import { es_ES, provideNzI18n } from 'ng-zorro-antd/i18n';
import es from '@angular/common/locales/es';

import { TranslateRootModule } from './core/i18n/translate.module';

// MSAL
import { MsalModule, MsalService, MsalGuard, MsalInterceptor } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './core/auth/msal-config';
import { routes } from './app-routing.module';

// ⬇️ NUEVO: factoría de inicialización
export function initializeMsal(msalService: MsalService) {
  return () => msalService.initialize(); // <- esto evita el "uninitialized_public_client_application"
}

registerLocaleData(es);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideNzIcons(),
    provideNzI18n(es_ES),
    provideRouter(routes, withComponentInputBinding(), withEnabledBlockingInitialNavigation()),
    
    importProvidersFrom(
      FormsModule,
      HttpClientModule,
      TranslateRootModule,

      // Puedes mantener forRoot como lo tienes. Alineo scopes de ejemplo con Graph;
      // si SOLO usarás tu API, puedes cambiar 'user.read' a tus scopes.
      MsalModule.forRoot(
        new PublicClientApplication(msalConfig),
        { // Guard config (login interactivo por redirect)
          interactionType: InteractionType.Redirect,
          authRequest: { scopes: ['User.Read'] } // o tus scopes si no usas Graph
        },
        { // Interceptor config (mapea recursos protegidos -> scopes)
          interactionType: InteractionType.Redirect,
          protectedResourceMap: new Map([
            ['https://graph.microsoft.com/v1.0/me', ['User.Read']]
          ])
        }
      )
    ),

    MsalService,
    MsalGuard,

    // ⬇️ NUEVO: inicializamos MSAL antes que todo
    { provide: APP_INITIALIZER, useFactory: initializeMsal, deps: [MsalService], multi: true },
  ]
};
