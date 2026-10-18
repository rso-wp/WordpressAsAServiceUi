import { Service, signal } from '@angular/core';
import { AuthAccount, AuthService, Credentials } from '../api/auth.service';
import { latency, readMock, removeMock, writeMock } from './mock-storage';

/** Pretends to be UserService sign-in: any email and password work, always as the same demo user. */
@Service()
export class MockAuthService extends AuthService {
  readonly kind = 'mock';
  private readonly current = signal<AuthAccount | null>(
    readMock<AuthAccount | null>('session', null),
  );
  readonly account = this.current.asReadonly();

  async initialize(): Promise<void> {}

  async signIn(credentials: Credentials): Promise<void> {
    await latency(700);
    this.start(credentials.email);
  }

  async signUp(credentials: Credentials): Promise<void> {
    await latency(700);
    this.start(credentials.email);
  }

  async signOut(): Promise<void> {
    removeMock('session');
    this.current.set(null);
  }

  async requestHeaders(): Promise<Record<string, string>> {
    return {};
  }

  private start(email: string): void {
    const account: AuthAccount = {
      id: '3f2b6c1e-8d4a-4a7e-9b1c-5e6f7a8b9c0d',
      email: email.trim().toLowerCase() || 'demo@contoso.com',
    };
    writeMock('session', account);
    this.current.set(account);
  }
}
