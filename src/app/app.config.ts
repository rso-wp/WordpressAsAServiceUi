import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/api/auth.service';
import { PaymentApi } from './core/api/payment-api';
import { ProvisioningApi } from './core/api/provisioning-api';
import { UserApi } from './core/api/user-api';
import { MockAuthService } from './core/mock/mock-auth.service';
import { MockPaymentApi } from './core/mock/mock-payment-api';
import { MockProvisioningApi } from './core/mock/mock-provisioning-api';
import { MockUserApi } from './core/mock/mock-user-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // Backend: mocks for now. Replace each with an HTTP / MSAL implementation of the same abstract class.
    { provide: AuthService, useExisting: MockAuthService },
    { provide: UserApi, useExisting: MockUserApi },
    { provide: PaymentApi, useExisting: MockPaymentApi },
    { provide: ProvisioningApi, useExisting: MockProvisioningApi },
  ],
};
