import { Environment } from './environment.model';

/** Production: real backend behind the gateway (same origin), Entra ID sign-in. Fill in the Entra app registration. */
export const environment: Environment = {
  backend: 'http',
  apiBaseUrl: '',
  auth: {
    mode: 'entra',
    clientId: 'REPLACE_WITH_SPA_CLIENT_ID',
    // Entra External ID (CIAM) tenant, e.g. https://contoso.ciamlogin.com/
    authority: 'https://REPLACE_TENANT.ciamlogin.com/',
    // The API scope exposed by the backend app registration (its audience is EntraId:Audience in the services).
    apiScopes: ['api://REPLACE_API_CLIENT_ID/access_as_user'],
  },
};
