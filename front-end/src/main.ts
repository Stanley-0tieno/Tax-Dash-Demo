import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    provideAnimationsAsync(),
     provideAnimations(),
    ...(appConfig.providers || []),
    importProvidersFrom(HttpClientModule)   
  ]
}).catch((err) => console.error(err));