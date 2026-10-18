export interface Environment {
  /** `http`: the real services. `mock`: simulated in the browser. */
  backend: 'http' | 'mock';
  /** Prefix for API calls; empty = same origin (dev-server proxy locally, the gateway in production). */
  apiBaseUrl: string;
  /** `password`: UserService accounts (email + password). `mock`: simulated, for `backend: 'mock'`. */
  auth: { mode: 'password' } | { mode: 'mock' };
}
