import { Service, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { AuthAccount, AuthService } from '../api/auth.service';
import { keycloakConfig } from './keycloak-config';
import { ensureRandomUuid } from './uuid';

const STORAGE_KEY = 'auth.keycloak';

interface SavedTokens {
  token: string;
  refreshToken: string;
  idToken?: string;
}

/**
 * Accounts live in Keycloak: signing in or up sends the browser to Keycloak's pages and back (authorization code flow), and the
 * access token it returns is sent as a bearer token to every service. Tokens are short-lived and renewed with the refresh token;
 * they are kept in sessionStorage so a reload keeps you signed in (a new tab goes through Keycloak again, which signs you in at
 * once while its session lasts).
 */
@Service()
export class KeycloakAuthService extends AuthService {
  readonly kind = 'keycloak';
  private readonly keycloak = new Keycloak(keycloakConfig(window.location));
  private readonly current = signal<AuthAccount | null>(null);
  readonly account = this.current.asReadonly();

  constructor() {
    super();
    ensureRandomUuid();
  }

  async initialize(): Promise<void> {
    this.keycloak.onAuthSuccess = () => this.save();
    this.keycloak.onAuthRefreshSuccess = () => this.save();
    this.keycloak.onAuthLogout = () => this.forget();

    try {
      // Handles the return from Keycloak (?code=... in the address) or restores the tokens kept from before a reload.
      await this.keycloak.init({
        ...read(),
        checkLoginIframe: false,
        // PKCE needs crypto.subtle, which browsers only offer on https and localhost.
        pkceMethod: window.isSecureContext ? 'S256' : false,
      });
    } catch {
      // Keycloak does not answer: stay signed out, the sign-in page says what to do.
      this.forget();
    }
    this.sync();
  }

  async signIn(): Promise<void> {
    await this.keycloak.login({ redirectUri: `${window.location.origin}/sites` });
  }

  async signUp(): Promise<void> {
    await this.keycloak.register({ redirectUri: `${window.location.origin}/sites` });
  }

  /** Ends the Keycloak session too: the browser goes to Keycloak and comes back to the sign-in page. */
  async signOut(): Promise<void> {
    this.forget();
    await this.keycloak.logout({ redirectUri: `${window.location.origin}/login` });
  }

  async requestHeaders(): Promise<Record<string, string>> {
    if (!this.keycloak.authenticated) return {};
    try {
      await this.keycloak.updateToken(30); // renews it when it expires within 30 seconds
    } catch {
      this.forget(); // the session is over (expired, signed out elsewhere)
      return {};
    }
    return this.keycloak.token ? { Authorization: `Bearer ${this.keycloak.token}` } : {};
  }

  private save(): void {
    const { token, refreshToken, idToken } = this.keycloak;
    if (token && refreshToken) write({ token, refreshToken, idToken });
    this.sync();
  }

  private forget(): void {
    write(null);
    this.current.set(null);
  }

  private sync(): void {
    const claims = this.keycloak.tokenParsed;
    this.current.set(
      this.keycloak.authenticated && claims?.sub
        ? { id: claims.sub, email: String(claims['email'] ?? '') }
        : null,
    );
  }
}

function read(): SavedTokens | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedTokens) : undefined;
  } catch {
    return undefined;
  }
}

function write(tokens: SavedTokens | null): void {
  try {
    if (tokens) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: the session then only lasts until reload
  }
}
