import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProvisioningApi } from '../api/provisioning-api';
import {
  ProvisionedSite,
  SiteNameTakenError,
  SubscriptionDeclinedError,
  UserFacingError,
} from '../models';
import { problemDetail, statusOf } from './problem';

/** ProvisioningService REST (`/provisions`). */
@Service()
export class HttpProvisioningApi extends ProvisioningApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/provisions`;

  async list(): Promise<ProvisionedSite[]> {
    const response = await firstValueFrom(
      this.http.get<{ userId: string; services: ProvisionedSite[] }>(this.base),
    );
    return response.services;
  }

  async create(name: string, paymentMethodId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.base, { name, paymentMethodId }));
    } catch (error) {
      const detail = problemDetail(error);
      if (!detail) throw error;
      switch (statusOf(error)) {
        case 402:
          throw new SubscriptionDeclinedError(detail);
        case 409:
          throw new SiteNameTakenError(detail);
        default:
          throw new UserFacingError(detail);
      }
    }
  }

  async delete(name: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.base}/${encodeURIComponent(name)}`));
  }
}
