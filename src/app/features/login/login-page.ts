import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { APP_CONFIG } from '../../core/config';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { BrandMark } from '../../shared/brand-mark';
import { FieldError, showInvalid } from '../../shared/field-error';

type Pending = 'signIn' | 'signUp' | null;

@Component({
  selector: 'app-login-page',
  imports: [BrandMark, FormField, FieldError],
  template: `
    <div class="grid min-h-screen lg:grid-cols-2">
      <section
        class="relative hidden flex-col justify-between overflow-hidden bg-wp-700 p-12 text-white lg:flex"
        aria-label="About"
      >
        <app-brand-mark [inverted]="true" />
        <div class="max-w-md">
          <p class="text-4xl leading-tight font-semibold">Your WordPress site, live in a minute.</p>
          <ul class="mt-8 space-y-4 text-wp-100">
            <li class="flex gap-3">
              <span aria-hidden="true">✓</span> Pick a name, add a card, done.
            </li>
            <li class="flex gap-3">
              <span aria-hidden="true">✓</span> Your own address: site.yourcompany.{{ baseDomain }}
            </li>
            <li class="flex gap-3">
              <span aria-hidden="true">✓</span> Its own database, managed for you.
            </li>
          </ul>
        </div>
        <p class="text-sm text-wp-200">Secure sign-in with Microsoft Entra ID.</p>
        <div
          class="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[40px] border-wp-600"
          aria-hidden="true"
        ></div>
      </section>

      <main class="flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-sm">
          <app-brand-mark class="mb-10 block text-wp-700 lg:hidden" />
          <h1 class="text-2xl font-semibold text-slate-900">Welcome</h1>
          <p class="mt-2 text-slate-600">
            {{
              devMode
                ? 'Sign in or create an account.'
                : 'Sign in or create an account with your Microsoft account.'
            }}
          </p>

          @if (devMode) {
            <div class="mt-6">
              <label class="field-label" for="dev-email">Email</label>
              <input
                id="dev-email"
                type="email"
                class="field-input"
                autocomplete="email"
                [formField]="f.email"
                [attr.aria-invalid]="invalid(f.email)"
                aria-describedby="dev-email-hint dev-email-error"
              />
              <p id="dev-email-hint" class="mt-1 text-xs text-slate-600">
                Local development: no Microsoft account, any email. The same email is the same user.
              </p>
              <app-field-error [field]="f.email" errorId="dev-email-error" />
            </div>
          }

          <div class="mt-8 space-y-3">
            <button
              type="button"
              class="btn-primary w-full py-3"
              [disabled]="pending() !== null"
              (click)="go('signIn')"
            >
              @if (!devMode) {
                <svg class="size-4" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              }
              {{
                pending() === 'signIn'
                  ? 'Signing in…'
                  : devMode
                    ? 'Sign in'
                    : 'Sign in with Microsoft'
              }}
            </button>

            <div class="flex items-center gap-3 py-1 text-xs text-slate-600" aria-hidden="true">
              <span class="h-px flex-1 bg-slate-200"></span> New here?
              <span class="h-px flex-1 bg-slate-200"></span>
            </div>

            <button
              type="button"
              class="btn-secondary w-full py-3"
              [disabled]="pending() !== null"
              (click)="go('signUp')"
            >
              {{ pending() === 'signUp' ? 'Opening sign-up…' : 'Create an account' }}
            </button>
          </div>

          @if (error(); as message) {
            <p class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
              {{ message }}
            </p>
          }

          @if (auth.kind === 'mock') {
            <p class="mt-10 rounded-md bg-wp-50 p-3 text-xs text-wp-900">
              Demo mode: everything is simulated in your browser, no backend or Microsoft account
              needed.
            </p>
          }
        </div>
      </main>
    </div>
  `,
})
export class LoginPage {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly devMode = this.auth.kind === 'dev';
  protected readonly invalid = showInvalid;
  private readonly model = signal({ email: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Enter an email to sign in as.' });
    email(p.email, { message: 'Enter a valid email.' });
  });

  protected readonly baseDomain = APP_CONFIG.baseDomain;
  protected readonly pending = signal<Pending>(null);
  protected readonly error = signal<string | null>(null);

  protected async go(action: Exclude<Pending, null>): Promise<void> {
    if (this.devMode && !(await submit(this.f, { action: async () => undefined }))) return;
    this.pending.set(action);
    this.error.set(null);
    try {
      const email = this.devMode ? this.model().email : undefined;
      // Entra redirects away here; dev and mock sign-in complete in place.
      await (action === 'signIn' ? this.auth.signIn(email) : this.auth.signUp(email));
      // The guards send a first-time user to /welcome.
      await this.router.navigateByUrl('/sites');
    } catch {
      this.error.set('Sign-in did not complete. Please try again.');
    } finally {
      this.pending.set(null);
    }
  }
}
