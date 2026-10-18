import { computed, inject, Service, signal } from '@angular/core';
import { UserApi } from './api/user-api';
import { ProfileInput, UserProfile } from './models';
import { tenantSlug } from './naming';

/** The signed-in user's profile (UserService `me`). */
@Service()
export class ProfileStore {
  private readonly api = inject(UserApi);
  private readonly state = signal<UserProfile | null>(null);
  private loading: Promise<UserProfile> | null = null;

  readonly profile = this.state.asReadonly();

  /** First sign-in: the user exists but has not filled in their details yet. */
  readonly isComplete = computed(() => {
    const p = this.state();
    return !!(p?.name && p.lastname && p.company);
  });

  /** Tenant part of site host names: assigned by UserService; before that, a preview from the company. */
  readonly tenant = computed(() => this.state()?.tenant ?? tenantSlug(this.state()?.company));

  readonly displayName = computed(() => {
    const p = this.state();
    return [p?.name, p?.lastname].filter(Boolean).join(' ') || p?.email || '';
  });

  /** Loads the profile once (creating the user on the backend on first sign-in). */
  load(): Promise<UserProfile> {
    const current = this.state();
    if (current) return Promise.resolve(current);

    this.loading ??= this.api
      .me()
      .then((profile) => {
        this.state.set(profile);
        return profile;
      })
      .finally(() => (this.loading = null));
    return this.loading;
  }

  async save(input: ProfileInput): Promise<void> {
    this.state.set(await this.api.patchMe(input));
  }

  clear(): void {
    this.state.set(null);
  }
}
