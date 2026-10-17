import { computed, inject, Service, signal } from '@angular/core';
import { ProvisioningApi } from './api/provisioning-api';
import { ProvisionedSite } from './models';

const POLL_MS = 2000;

/** The user's sites. Polls while any site is still being set up or removed. */
@Service()
export class SitesStore {
  private readonly api = inject(ProvisioningApi);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly sites = signal<ProvisionedSite[]>([]);
  readonly loaded = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly inProgress = computed(() =>
    this.sites().some((s) => s.provisioningStatus === 'Queued' || s.provisioningStatus === 'Deleting'),
  );

  async refresh(): Promise<void> {
    clearTimeout(this.timer);
    try {
      this.sites.set(await this.api.list());
      this.loadError.set(null);
    } catch {
      this.loadError.set('Could not load your sites. Retrying…');
    } finally {
      this.loaded.set(true);
    }
    if (this.inProgress() || this.loadError()) {
      this.timer = setTimeout(() => this.refresh(), POLL_MS);
    }
  }

  /** Throws `SubscriptionDeclinedError` / `SiteNameTakenError` (fail fast); on success the site shows up as Queued. */
  async start(name: string, paymentMethodId: string): Promise<void> {
    await this.api.create(name, paymentMethodId);
    await this.refresh();
  }

  async remove(name: string): Promise<void> {
    await this.api.delete(name);
    await this.refresh();
  }

  stop(): void {
    clearTimeout(this.timer);
    this.sites.set([]);
    this.loaded.set(false);
  }
}
