import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import Aura from '@primeng/themes/aura';
import { provideEffects } from '@ngrx/effects';
import { EtoanEffects } from './store/effects/etoan-effects';
import { provideStore } from '@ngrx/store';
import { etoanReducer } from './store/reducers/etoan-reducers';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideEffects([EtoanEffects]),
    provideStore({etoanReducer: etoanReducer}),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false
        }
      }
    })
  ],
};
