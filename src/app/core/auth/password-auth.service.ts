import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AuthAccount, AuthService, Credentials } from '../api/auth.service';
import { postGraphQl } from '../http/graphql';

const STORAGE_KEY = 'auth.session';

interface Session {
  accessToken: string;
  /** ISO date; the services reject the token after it. */
  expiresAt: string;
  account: AuthAccount;
}

interface AuthPayload {
  accessToken: string;
  expiresAt: string;
  user: AuthAccount;
}

/**
 * Email + password accounts of UserService (`signUp` / `logIn` mutations). The returned access token is sent as a
 * bearer token to every service. There is no refresh token: when it expires the user signs in again.
 */
@Service()
export class PasswordAuthService extends AuthService {
  readonly kind = 'password';
  private readonly http = inject(HttpClient);
  private readonly session = signal<Session | null>(read());
  readonly account = computed(() => this.session()?.account ?? null);

  async initialize(): Promise<void> {
    const session = this.session();
    if (session && Date.parse(session.expiresAt) <= Date.now()) this.store(null);
  }

  signIn(credentials: Credentials): Promise<void> {
    return this.start('logIn', credentials);
  }

  signUp(credentials: Credentials): Promise<void> {
    return this.start('signUp', credentials);
  }

  async signOut(): Promise<void> {
    this.store(null);
  }

  async requestHeaders(): Promise<Record<string, string>> {
    const session = this.session();
    return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
  }

  private async start(operation: 'logIn' | 'signUp', credentials: Credentials): Promise<void> {
    const mutation = `mutation Auth($input: CredentialsInput!) {
      ${operation}(input: $input) { accessToken expiresAt user { id email } }
    }`;
    const data = await postGraphQl<Record<string, AuthPayload>>(this.http, mutation, {
      input: { email: credentials.email.trim(), password: credentials.password },
    });
    const { accessToken, expiresAt, user } = data[operation];
    this.store({ accessToken, expiresAt, account: { id: user.id, email: user.email } });
  }

  private store(session: Session | null): void {
    write(session);
    this.session.set(session);
  }
}

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function write(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: the session then only lasts until reload
  }
}
