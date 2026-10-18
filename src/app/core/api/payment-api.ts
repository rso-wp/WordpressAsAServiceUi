import { NewCardInput, PaymentCard, PaymentConfig } from '../models';

/** PaymentService (REST, `/payment-methods`). */
export abstract class PaymentApi {
  /** `GET /payment-methods/config`: how cards are collected. */
  abstract config(): Promise<PaymentConfig>;

  /** `GET /payment-methods`: cards saved on the user's Stripe customer, newest first. */
  abstract listCards(): Promise<PaymentCard[]>;

  /** `POST /payment-methods/fake`: Development only (fake Stripe). Only brand, last 4 and expiry are kept. */
  abstract addFakeCard(input: NewCardInput): Promise<PaymentCard>;

  /** `POST /payment-methods/setup-intent`: client secret for Stripe Elements (`stripe.confirmSetup`). */
  abstract createSetupIntent(): Promise<string>;
}
