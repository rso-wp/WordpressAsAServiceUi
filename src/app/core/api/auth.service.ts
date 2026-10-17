import { Signal } from '@angular/core';

/** The signed-in Entra ID account (claims from the ID token). */
export interface AuthAccount {
  /** Entra object id (`oid`), the user id in every backend service. */
  oid: string;
  email: string;
}

/**
 * Entra ID sign-in. Real implementation: MSAL (`@azure/msal-angular`) with an Entra External ID user flow that offers
 * both sign-in and sign-up, plus an HTTP interceptor that adds the access token to API calls.
 */
export abstract class AuthService {
  abstract readonly account: Signal<AuthAccount | null>;

  /** Redirects to the Entra sign-in page. */
  abstract signIn(): Promise<void>;

  /** Redirects to the Entra sign-up page (same user flow, sign-up tab). */
  abstract signUp(): Promise<void>;

  abstract signOut(): Promise<void>;
}
