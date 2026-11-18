import { Environment } from './environment.model';

/** Production: real backend behind the gateway (same origin), sign-in and sign-up through Keycloak. */
export const environment: Environment = {
  backend: 'http',
  apiBaseUrl: '',
  auth: { mode: 'keycloak' },
};
