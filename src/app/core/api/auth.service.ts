import { Signal } from '@angular/core';

/** The signed-in account. */
export interface AuthAccount {
  /** Entra object id (`oid`), the user id in every backend service. */
  oid: string;
  email: string;
}

export abstract class AuthService {
  /**
   * `entra`: Microsoft sign-in (redirect). `dev`: the services' DevAuth headers, any email (local development).
   * `mock`: simulated, no backend.
   */
  abstract readonly kind: 'entra' | 'dev' | 'mock';

  abstract readonly account: Signal<AuthAccount | null>;

  /** Runs once at startup (e.g. completes a sign-in redirect). */
  abstract initialize(): Promise<void>;

  /** `entra` redirects to Microsoft; `dev` needs the email to sign in as. */
  abstract signIn(email?: string): Promise<void>;

  /** Like {@link signIn}, but opens the sign-up page of the Entra user flow. */
  abstract signUp(email?: string): Promise<void>;

  abstract signOut(): Promise<void>;

  /** Headers that authenticate an API request (bearer token, or DevAuth headers). */
  abstract requestHeaders(): Promise<Record<string, string>>;
}
