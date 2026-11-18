import { Environment } from './environment.model';

/**
 * `npm start`: the real services on this machine (docs2/local-development.md), reached through the dev-server proxy
 * (proxy.conf.json). Sign-in and sign-up through Keycloak (docker compose, port 8180), same as production.
 */
export const environment: Environment = {
  backend: 'http',
  apiBaseUrl: '',
  auth: { mode: 'keycloak' },
};
