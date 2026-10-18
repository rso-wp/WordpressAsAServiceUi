import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  Provider,
  Type,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { environment } from '../environments/environment';
import { Environment } from '../environments/environment.model';
import { routes } from './app.routes';
import { AuthService } from './core/api/auth.service';
import { PaymentApi } from './core/api/payment-api';
import { ProvisioningApi } from './core/api/provisioning-api';
import { UserApi } from './core/api/user-api';
import { PasswordAuthService } from './core/auth/password-auth.service';
import { authInterceptor } from './core/http/auth.interceptor';
import { HttpPaymentApi } from './core/http/http-payment-api';
import { HttpProvisioningApi } from './core/http/http-provisioning-api';
import { HttpUserApi } from './core/http/http-user-api';
import { MockAuthService } from './core/mock/mock-auth.service';
import { MockPaymentApi } from './core/mock/mock-payment-api';
import { MockProvisioningApi } from './core/mock/mock-provisioning-api';
import { MockUserApi } from './core/mock/mock-user-api';

const AUTH: Record<Environment['auth']['mode'], Type<AuthService>> = {
  password: PasswordAuthService,
  mock: MockAuthService,
};

const BACKEND: Record<Environment['backend'], Provider[]> = {
  http: [
    { provide: UserApi, useExisting: HttpUserApi },
    { provide: PaymentApi, useExisting: HttpPaymentApi },
    { provide: ProvisioningApi, useExisting: HttpProvisioningApi },
  ],
  mock: [
    { provide: UserApi, useExisting: MockUserApi },
    { provide: PaymentApi, useExisting: MockPaymentApi },
    { provide: ProvisioningApi, useExisting: MockProvisioningApi },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),

    // Chosen by the environment file: src/environments/environment*.ts
    { provide: AuthService, useExisting: AUTH[environment.auth.mode] },
    ...BACKEND[environment.backend],
    provideAppInitializer(() => inject(AuthService).initialize()),
  ],
};
