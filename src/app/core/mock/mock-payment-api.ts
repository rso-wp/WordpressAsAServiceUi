import { inject, Service } from '@angular/core';
import { AuthService } from '../api/auth.service';
import { PaymentApi } from '../api/payment-api';
import { NewCardInput, PaymentCard, PaymentConfig } from '../models';
import { latency, readMock, writeMock } from './mock-storage';

@Service()
export class MockPaymentApi extends PaymentApi {
  private readonly auth = inject(AuthService);

  async config(): Promise<PaymentConfig> {
    return { mode: 'fake' };
  }

  async listCards(): Promise<PaymentCard[]> {
    await latency(300);
    return readMock<PaymentCard[]>(this.key(), []);
  }

  async addFakeCard(input: NewCardInput): Promise<PaymentCard> {
    await latency(800);
    const digits = input.number.replace(/\D/g, '');
    const [month, year] = input.expiry.split('/').map((part) => Number(part.trim()));
    const card: PaymentCard = {
      id: `pm_mock_${Math.random().toString(36).slice(2, 12)}`,
      brand: brandOf(digits),
      last4: digits.slice(-4),
      expMonth: month,
      expYear: 2000 + year,
    };
    writeMock(this.key(), [card, ...readMock<PaymentCard[]>(this.key(), [])]);
    return card;
  }

  createSetupIntent(): Promise<string> {
    return Promise.reject(new Error('The mock backend has no Stripe.'));
  }

  private key(): string {
    return `cards.${this.auth.account()?.id ?? 'anonymous'}`;
  }
}

function brandOf(digits: string): string {
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Card';
}
