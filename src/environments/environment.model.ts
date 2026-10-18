export interface EntraAuthConfig {
  mode: 'entra';
  /** Client id of the SPA app registration. */
  clientId: string;
  authority: string;
  /** Scopes requested for the backend APIs (access token audience = EntraId:Audience of the services). */
  apiScopes: string[];
}

export interface Environment {
  /** `http`: the real services. `mock`: simulated in the browser. */
  backend: 'http' | 'mock';
  /** Prefix for API calls; empty = same origin (dev-server proxy locally, the gateway in production). */
  apiBaseUrl: string;
  /**
   * `entra`: Microsoft Entra ID (MSAL). `dev`: the services' DevAuth headers (Development only, any email).
   * `mock`: simulated, for `backend: 'mock'`.
   */
  auth: EntraAuthConfig | { mode: 'dev' } | { mode: 'mock' };
}
