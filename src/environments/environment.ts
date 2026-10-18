import { Environment } from './environment.model';

/** Production: real backend behind the gateway (same origin), UserService email + password sign-in. */
export const environment: Environment = {
  backend: 'http',
  apiBaseUrl: '',
  auth: { mode: 'password' },
};
