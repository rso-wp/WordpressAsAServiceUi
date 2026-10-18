import { Signal } from '@angular/core';

/** The signed-in account. */
export interface AuthAccount {
  /** UserService user id (the token's `sub`), the user id in every backend service. */
  id: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export abstract class AuthService {
  /** `password`: UserService accounts (email + password). `mock`: simulated, no backend. */
  abstract readonly kind: 'password' | 'mock';
  abstract readonly account: Signal<AuthAccount | null>;
  /** Runs once at startup (e.g. drops an expired session). */
  abstract initialize(): Promise<void>;
  abstract signIn(credentials: Credentials): Promise<void>;
  /** Creates the account, then signs it in. */
  abstract signUp(credentials: Credentials): Promise<void>;
  abstract signOut(): Promise<void>;
  /** Headers that authenticate an API request (the bearer token). */
  abstract requestHeaders(): Promise<Record<string, string>>;
}

/** The backend no longer accepts the session (token expired, account gone): forget it and start over at sign-in. */
export async function endSession(auth: AuthService): Promise<void> {
  await auth.signOut();
  window.location.assign('/login');
}
