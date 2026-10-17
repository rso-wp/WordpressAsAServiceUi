import { NewCardInput, PaymentCard } from '../models';

/** PaymentService (REST, `/payment-methods`). */
export abstract class PaymentApi {
  /**
   * Cards saved on the user's Stripe customer.
   * Backend: not implemented yet (needs e.g. `GET /payment-methods`).
   */
  abstract listCards(): Promise<PaymentCard[]>;

  /**
   * Saves a card. Real flow: `POST /payment-methods/setup-intent`, then `stripe.confirmSetup()` with Stripe Elements,
   * so card numbers never reach our servers.
   */
  abstract addCard(input: NewCardInput): Promise<PaymentCard>;
}
