import { inject, Service } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { UserApi } from '../api/user-api';
import { ProfileInput, UserProfile } from '../models';
import { tenantSlug } from '../naming';
import { latency, readMock, writeMock } from './mock-storage';

@Service()
export class MockUserApi extends UserApi {
  private readonly auth = inject(AuthService);

  async me(): Promise<UserProfile> {
    await latency(300);
    const account = this.requireAccount();
    const users = readMock<Record<string, UserProfile>>('users', {});

    // Like UserService: the first `me` creates the user.
    users[account.id] ??= {
      id: account.id,
      email: account.email,
      name: null,
      lastname: null,
      company: null,
      tenant: null,
    };
    writeMock('users', users);
    return users[account.id];
  }

  async patchMe(input: ProfileInput): Promise<UserProfile> {
    await latency(500);
    const current = await this.me();
    // Like UserService: the tenant is assigned once, from the first company.
    const updated = { ...current, ...input, tenant: current.tenant ?? tenantSlug(input.company) };
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
