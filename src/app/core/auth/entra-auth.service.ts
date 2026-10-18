import { Service, signal } from '@angular/core';
import type { AccountInfo, IPublicClientApplication } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';
import { EntraAuthConfig } from '../../../environments/environment.model';
import { AuthAccount, AuthService } from '../api/auth.service';

/**
 * Microsoft Entra ID (External ID) sign-in with MSAL, redirect flow. Sign-up uses the same user flow with
 * `prompt=create`. API calls get an access token for `apiScopes`. MSAL is loaded on demand, so builds that use another
 * sign-in mode do not download it.
 */
@Service()
export class EntraAuthService extends AuthService {
  readonly kind = 'entra';
  private readonly config = environment.auth as EntraAuthConfig;
  private readonly current = signal<AuthAccount | null>(null);
  readonly account = this.current.asReadonly();

  private msalInstance: IPublicClientApplication | null = null;

  private get msal(): IPublicClientApplication {
    if (!this.msalInstance) throw new Error('EntraAuthService.initialize() has not run.');
    return this.msalInstance;
  }

  async initialize(): Promise<void> {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId: this.config.clientId,
        authority: this.config.authority,
        knownAuthorities: [new URL(this.config.authority).host],
        redirectUri: window.location.origin,
        postLogoutRedirectUri: `${window.location.origin}/login`,
      },
      cache: { cacheLocation: 'localStorage' },
    });

    await this.msal.initialize();
    const result = await this.msal.handleRedirectPromise();
    const account =
      result?.account ?? this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0] ?? null;
    this.msal.setActiveAccount(account);
    this.current.set(toAccount(account));
  }

  async signIn(): Promise<void> {
    await this.msal.loginRedirect({ scopes: this.config.apiScopes });
  }

  async signUp(): Promise<void> {
    await this.msal.loginRedirect({ scopes: this.config.apiScopes, prompt: 'create' });
  }

  async signOut(): Promise<void> {
    const account = this.msal.getActiveAccount();
    this.current.set(null);
    await this.msal.logoutRedirect({ account });
  }

  async requestHeaders(): Promise<Record<string, string>> {
    const account = this.msal.getActiveAccount();
    if (!account) return {};
    try {
      const result = await this.msal.acquireTokenSilent({ scopes: this.config.apiScopes, account });
      return { Authorization: `Bearer ${result.accessToken}` };
    } catch (error) {
      const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
      if (error instanceof InteractionRequiredAuthError) {
        await this.msal.acquireTokenRedirect({ scopes: this.config.apiScopes, account });
      }
      throw error;
    }
  }
}

function toAccount(account: AccountInfo | null): AuthAccount | null {
  if (!account) return null;
  const oid = (account.idTokenClaims?.['oid'] as string | undefined) ?? account.localAccountId;
  return { oid, email: account.username };
}
