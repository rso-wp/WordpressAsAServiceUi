import { Environment } from './environment.model';

/**
 * `npm start`: the real services on this machine (docs2/local-development.md), reached through the dev-server proxy
 * (proxy.conf.json). Sign-in uses the services' DevAuth headers instead of Entra.
 */
export const environment: Environment = {
  backend: 'http',
  apiBaseUrl: '',
  auth: { mode: 'dev' },
};
