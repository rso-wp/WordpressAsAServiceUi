export interface Environment {
  /** `http`: the real services. `mock`: simulated in the browser. */
  backend: 'http' | 'mock';
  /** Prefix for API calls; empty = same origin (dev-server proxy locally, the gateway in production). */
  apiBaseUrl: string;
  /** `keycloak`: accounts in Keycloak, found next to the app (core/auth/keycloak-config.ts). `mock`: simulated, for `backend: 'mock'`. */
  auth: { mode: 'keycloak' } | { mode: 'mock' };
}
