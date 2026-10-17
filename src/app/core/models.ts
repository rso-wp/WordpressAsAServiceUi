// Shapes follow the backend contracts in docs2/ so the mock APIs can be swapped for HTTP clients.

/** UserService `User` (GraphQL `me` / `patchMe`). */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  company: string | null;
}

export interface ProfileInput {
  name: string;
  lastname: string;
  company: string;
}

/** ProvisioningService `ProvisioningStatus`. */
export type ProvisioningStatus = 'Queued' | 'Provisioned' | 'Failed' | 'Deleting';

/** One entry of ProvisioningService `GET /provisions`. */
export interface ProvisionedSite {
  name: string;
  provisioningStatus: ProvisioningStatus;
  startDate: string;
  url: string | null;
}

/** A card saved on the user's Stripe customer. */
export interface PaymentCard {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
}

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Card';

/** Card details as typed by the user. With real Stripe this is collected by Stripe Elements instead. */
export interface NewCardInput {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
}

/** The subscription could not be started (HTTP 402 from POST /provisions). Message is safe to show. */
export class SubscriptionDeclinedError extends Error {}

/** The site name is already in use (HTTP 409 from POST /provisions). */
export class SiteNameTakenError extends Error {}
