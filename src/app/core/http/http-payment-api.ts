import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentApi } from '../api/payment-api';
import { NewCardInput, PaymentCard, PaymentConfig, UserFacingError } from '../models';
import { problemDetail } from './problem';

/** PaymentService REST (`/payment-methods`). */
@Service()
export class HttpPaymentApi extends PaymentApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/payment-methods`;

  config(): Promise<PaymentConfig> {
    return firstValueFrom(this.http.get<PaymentConfig>(`${this.base}/config`));
  }

  listCards(): Promise<PaymentCard[]> {
    return firstValueFrom(this.http.get<PaymentCard[]>(this.base));
  }

  async addFakeCard(input: NewCardInput): Promise<PaymentCard> {
    try {
      return await firstValueFrom(
        this.http.post<PaymentCard>(`${this.base}/fake`, {
          number: input.number,
          expiry: input.expiry,
        }),
      );
    } catch (error) {
      const detail = problemDetail(error);
      throw detail ? new UserFacingError(detail) : error;
    }
  }

  async createSetupIntent(): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ clientSecret: string }>(`${this.base}/setup-intent`, {}),
    );
    return response.clientSecret;
  }
}
