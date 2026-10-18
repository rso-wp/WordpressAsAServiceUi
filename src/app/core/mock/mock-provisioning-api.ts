import { inject, Service } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { ProvisioningApi } from '../api/provisioning-api';
import { ProvisionedSite, SiteNameTakenError, SubscriptionDeclinedError } from '../models';
import { siteHost } from '../naming';
import { ProfileStore } from '../profile.store';
import { latency, readMock, writeMock } from './mock-storage';

/** Stored mock site. The status is derived from timestamps, so it keeps progressing across reloads. */
interface MockSite {
  name: string;
  host: string;
  createdAt: number;
  deleteRequestedAt?: number;
}

const PROVISIONING_MS = 6000;
const DELETING_MS = 3000;

/**
 * Behaves like ProvisioningService + PaymentService:
 * - a card ending in 0002 is declined (Stripe's generic-decline test card) -> 402;
 * - a name starting with "fail" ends up Failed (provisioning error);
 * - everything else is Provisioned after a few seconds.
 */
@Service()
export class MockProvisioningApi extends ProvisioningApi {
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileStore);

  async list(): Promise<ProvisionedSite[]> {
    await latency(250);
    const now = Date.now();
    const alive = this.read().filter(
      (site) => !site.deleteRequestedAt || now - site.deleteRequestedAt < DELETING_MS,
    );
    this.write(alive);

    return alive
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((site) => {
        const status = statusOf(site, now);
        return {
          name: site.name,
          host: site.host,
          provisioningStatus: status,
          startDate: new Date(site.createdAt).toISOString(),
          url: status === 'Provisioned' || status === 'Deleting' ? `https://${site.host}` : null,
        };
      });
  }

  async create(name: string, paymentMethodId: string): Promise<void> {
    await latency(900);
    const sites = this.read();
    if (sites.some((site) => site.name === name)) {
      throw new SiteNameTakenError(`You already have a site called "${name}".`);
    }

    const card = readMock<{ id: string; last4: string }[]>(`cards.${this.oid()}`, []).find(
      (c) => c.id === paymentMethodId,
    );
    if (card?.last4 === '0002') {
      throw new SubscriptionDeclinedError('Your card was declined.');
    }

    sites.push({ name, host: siteHost(name, this.profile.tenant()), createdAt: Date.now() });
    this.write(sites);
  }

  async delete(name: string): Promise<void> {
    await latency(400);
    this.write(
      this.read().map((site) =>
        site.name === name
          ? { ...site, deleteRequestedAt: site.deleteRequestedAt ?? Date.now() }
          : site,
      ),
    );
  }

  private oid(): string {
    return this.auth.account()?.oid ?? 'anonymous';
  }

  private read(): MockSite[] {
    return readMock<MockSite[]>(`sites.${this.oid()}`, []);
  }

  private write(sites: MockSite[]): void {
    writeMock(`sites.${this.oid()}`, sites);
  }
}

function statusOf(site: MockSite, now: number): ProvisionedSite['provisioningStatus'] {
  if (site.deleteRequestedAt) return 'Deleting';
  if (now - site.createdAt < PROVISIONING_MS) return 'Queued';
  return site.name.startsWith('fail') ? 'Failed' : 'Provisioned';
}
