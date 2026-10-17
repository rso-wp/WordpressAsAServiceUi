import { inject, Service } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { UserApi } from '../api/user-api';
import { ProfileInput, UserProfile } from '../models';
import { latency, readMock, writeMock } from './mock-storage';

@Service()
export class MockUserApi extends UserApi {
  private readonly auth = inject(AuthService);

  async me(): Promise<UserProfile> {
    await latency(300);
    const account = this.requireAccount();
    const users = readMock<Record<string, UserProfile>>('users', {});

    // Like UserService: the first `me` creates the user.
    users[account.oid] ??= {
      id: account.oid,
      email: account.email,
      name: null,
      lastname: null,
      company: null,
    };
    writeMock('users', users);
    return users[account.oid];
  }

  async patchMe(input: ProfileInput): Promise<UserProfile> {
    await latency(500);
    const current = await this.me();
    const updated = { ...current, ...input };
    const users = readMock<Record<string, UserProfile>>('users', {});
    users[updated.id] = updated;
    writeMock('users', users);
    return updated;
  }

  private requireAccount() {
    const account = this.auth.account();
    if (!account) throw new Error('Not signed in.');
    return account;
  }
}
