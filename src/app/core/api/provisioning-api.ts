import { ProvisionedSite } from '../models';

/** ProvisioningService (REST, `/provisions`). */
export abstract class ProvisioningApi {
  /** `GET /provisions`, newest first. */
  abstract list(): Promise<ProvisionedSite[]>;

  /**
   * `POST /provisions`. Fails fast: throws `SubscriptionDeclinedError` (402) or `SiteNameTakenError` (409); on success the
   * site is `Queued` and provisioning continues in the background.
   * Backend: does not take `paymentMethodId` yet (it charges the default / latest card).
   */
  abstract create(name: string, paymentMethodId: string): Promise<void>;

  /** `DELETE /provisions/{name}`: cancels the subscription and removes the site. */
  abstract delete(name: string): Promise<void>;
}
