import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthAccount, AuthError, AuthService, Credentials } from '../api/auth.service';

const STORAGE_KEY = 'auth.session';

interface Session {
  accessToken: string;
  /** ISO date; the services reject the token after it. */
  expiresAt: string;
  account: AuthAccount;
}

interface ProblemResponse {
  detail?: string;
  code?: string;
}

interface AuthPayload {
  accessToken: string;
  expiresAt: string;
  user: AuthAccount;
}

/**
 * Email + password accounts of UserService (`POST /auth/signup` and `POST /auth/login`). The returned access token is sent as a
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
    return this.start('login', credentials);
  }

  signUp(credentials: Credentials): Promise<void> {
    return this.start('signup', credentials);
  }

  async signOut(): Promise<void> {
    this.store(null);
  }

  async requestHeaders(): Promise<Record<string, string>> {
    const session = this.session();
    return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
  }

  private async start(path: 'login' | 'signup', credentials: Credentials): Promise<void> {
    let payload: AuthPayload;
    try {
      payload = await firstValueFrom(
        this.http.post<AuthPayload>(`${environment.apiBaseUrl}/auth/${path}`, {
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      );
    } catch (error) {
      // A problem response: `detail` is meant for the user, `code` for the client.
      const problem = error instanceof HttpErrorResponse ? (error.error as ProblemResponse | null) : null;
      throw new AuthError(problem?.detail ?? 'Request failed.', problem?.code ?? null);
    }
    const { accessToken, expiresAt, user } = payload;
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
