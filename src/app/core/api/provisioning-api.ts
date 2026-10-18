import { ProvisionedSite } from '../models';

/** ProvisioningService (REST, `/provisions`). */
export abstract class ProvisioningApi {
  /** `GET /provisions`, newest first. */
  abstract list(): Promise<ProvisionedSite[]>;

  /**
   * `POST /provisions`. Fails fast with a `UserFacingError` (402 `SubscriptionDeclinedError`, 409 `SiteNameTakenError`,
   * 400/502); on success the site is `Queued` and provisioning continues in the background.
   */
  abstract create(name: string, paymentMethodId: string): Promise<void>;

  /** `DELETE /provisions/{name}`: cancels the subscription and removes the site. */
  abstract delete(name: string): Promise<void>;
}
