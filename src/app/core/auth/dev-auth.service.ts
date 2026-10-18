import { Service, signal } from '@angular/core';
import { AuthAccount, AuthService } from '../api/auth.service';

const STORAGE_KEY = 'dev.session';

/**
 * Local development against the real services: they accept `X-Dev-User-Id` / `X-Dev-User-Email` instead of an Entra
 * token (DevAuth, Development only). Any email works; the same email always gets the same user id, so signing in again
 * as the same email is the same user.
 */
@Service()
export class DevAuthService extends AuthService {
  readonly kind = 'dev';
  private readonly current = signal<AuthAccount | null>(read());
  readonly account = this.current.asReadonly();

  async initialize(): Promise<void> {}

  async signIn(email?: string): Promise<void> {
    const normalized = (email ?? '').trim().toLowerCase();
    if (!normalized) throw new Error('An email is required for dev sign-in.');

    const account = { oid: await userIdFor(normalized), email: normalized };
    write(account);
    this.current.set(account);
  }

  signUp(email?: string): Promise<void> {
    return this.signIn(email);
  }

  async signOut(): Promise<void> {
    write(null);
    this.current.set(null);
  }

  async requestHeaders(): Promise<Record<string, string>> {
    const account = this.current();
    return account ? { 'X-Dev-User-Id': account.oid, 'X-Dev-User-Email': account.email } : {};
  }
}

/** A stable GUID derived from the email (SHA-256, formatted as a GUID). */
async function userIdFor(email: string): Promise<string> {
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email)),
  );
  const hex = Array.from(hash.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function read(): AuthAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthAccount) : null;
  } catch {
    return null;
  }
}

function write(account: AuthAccount | null): void {
  try {
    if (account) localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: the session then only lasts until reload
  }
}
