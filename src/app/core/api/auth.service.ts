import { Signal } from '@angular/core';

/** The signed-in account. */
export interface AuthAccount {
  /** Keycloak user id (the token's `sub`), the user id in every backend service. */
  id: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export abstract class AuthService {
  /** `keycloak`: Keycloak accounts (the browser goes to Keycloak to sign in or up). `mock`: simulated, no backend. */
  abstract readonly kind: 'keycloak' | 'mock';
  abstract readonly account: Signal<AuthAccount | null>;
  /** Runs once at startup (e.g. finishes a sign-in that returns from Keycloak, or drops an expired session). */
  abstract initialize(): Promise<void>;
  /** Mock: signs in with the credentials. Keycloak: sends the browser to Keycloak's sign-in page (no credentials here). */
  abstract signIn(credentials?: Credentials): Promise<void>;
  /** Mock: creates the account and signs it in. Keycloak: sends the browser to Keycloak's registration page. */
  abstract signUp(credentials?: Credentials): Promise<void>;
  /** Keycloak: also ends its session (the browser goes to Keycloak and comes back to /login). */
  abstract signOut(): Promise<void>;
  /** Headers that authenticate an API request (the bearer token, renewed when it is about to expire). */
  abstract requestHeaders(): Promise<Record<string, string>>;
}

/** The backend no longer accepts the session (token expired, account gone): forget it and start over at sign-in. */
export async function endSession(auth: AuthService): Promise<void> {
  await auth.signOut();
  // Keycloak's sign-out already brings the browser back to /login.
  if (auth.kind !== 'keycloak') window.location.assign('/login');
}
