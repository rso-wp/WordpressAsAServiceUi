import { Service, signal } from '@angular/core';
import { AuthAccount, AuthService } from '../api/auth.service';
import { latency, readMock, removeMock, writeMock } from './mock-storage';

/** Pretends to be Entra ID: "signing in" always succeeds as the same demo account. */
@Service()
export class MockAuthService extends AuthService {
  private readonly current = signal<AuthAccount | null>(readMock<AuthAccount | null>('session', null));
  readonly account = this.current.asReadonly();

  async signIn(): Promise<void> {
    await latency(700);
    this.start();
  }

  async signUp(): Promise<void> {
    await latency(700);
    this.start();
  }

  async signOut(): Promise<void> {
    removeMock('session');
    this.current.set(null);
  }

  private start(): void {
    const account: AuthAccount = {
      oid: '3f2b6c1e-8d4a-4a7e-9b1c-5e6f7a8b9c0d',
      email: 'demo@contoso.com',
    };
    writeMock('session', account);
    this.current.set(account);
  }
}
