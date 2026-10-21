// Shapes follow the backend contracts in docs2/.

/** UserService `User` (GraphQL `me` / `patchMe`). */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  company: string | null;
  /** Assigned by UserService when the company is first set; part of every site host name. */
  tenant: string | null;
}

export interface ProfileInput {
  name: string;
  lastname: string;
  company: string;
}

/** ProvisioningService `ProvisioningStatus`. */
export type ProvisioningStatus = 'PendingPayment' | 'Queued' | 'Provisioned' | 'Failed' | 'Deleting';

/** Still changing on its own: the site list polls while any site is in one of these. */
export function inProgress(status: ProvisioningStatus): boolean {
  return status === 'PendingPayment' || status === 'Queued' || status === 'Deleting';
}

/** One entry of ProvisioningService `GET /provisions`. */
export interface ProvisionedSite {
  name: string;
  /** site.tenant.domain */
  host: string;
  provisioningStatus: ProvisioningStatus;
  startDate: string;
  /** Where the site actually answers (locally a docker port), null until it is running. */
  url: string | null;
}

/** A card saved on the user's Stripe customer (PaymentService `GET /payment-methods`). */
export interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/** PaymentService `GET /payment-methods/config`: Stripe Elements, or the dev-only fake card form. */
export type PaymentConfig = { mode: 'stripe'; publishableKey: string } | { mode: 'fake' };

/** Card details typed into the fake card form (Development only; with Stripe, Elements collects the card). */
export interface NewCardInput {
  holder: string;
  number: string;
  expiry: string;
  cvc: string;
}

/** An error whose message comes from the backend and is meant for the user. */
export class UserFacingError extends Error {}

/** The subscription could not be started (HTTP 402 from POST /provisions). */
export class SubscriptionDeclinedError extends UserFacingError {}

/** Name taken, or the account is not ready yet (HTTP 409 from POST /provisions). */
export class SiteNameTakenError extends UserFacingError {}
