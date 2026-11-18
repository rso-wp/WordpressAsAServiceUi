/** Where Keycloak is and which realm and client the app uses (the realm is imported from Deployment/local/keycloak/rso-realm.json). */
export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

/**
 * Keycloak is not configured in the bundle (the same image runs in every environment); it is found from the address the app
 * is served at: `keycloak.<host>` next to the app (Terraform / the chart publish it there), or localhost:8180 (the compose
 * file) when the app runs on this machine.
 */
export function keycloakConfig(location: Pick<Location, 'protocol' | 'host' | 'hostname'>): KeycloakConfig {
  const url = LOCAL_HOSTS.includes(location.hostname)
    ? 'http://localhost:8180'
    : `${location.protocol}//keycloak.${location.host}`;
  return { url, realm: 'rso', clientId: 'rso-frontend' };
}
