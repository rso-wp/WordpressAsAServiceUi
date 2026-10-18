import { Component, computed, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { APP_CONFIG } from '../../core/config';
import { GraphQlError } from '../../core/http/graphql';
import { BrandMark } from '../../shared/brand-mark';
import { FieldError, showInvalid } from '../../shared/field-error';

type Mode = 'signIn' | 'signUp';

/** Same limits as UserService (AccountService). */
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

/** UserService error codes whose message is meant for the user. */
const USER_FACING_CODES = [
  'INVALID_EMAIL',
  'INVALID_PASSWORD',
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
];

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
        <p class="text-sm text-wp-200">One account for all your sites.</p>
        <div
          class="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[40px] border-wp-600"
          aria-hidden="true"
        ></div>
      </section>

      <main class="flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-sm">
          <app-brand-mark class="mb-10 block text-wp-700 lg:hidden" />
          <h1 class="text-2xl font-semibold text-slate-900">
            {{ mode() === 'signIn' ? 'Welcome back' : 'Create your account' }}
          </h1>
          <p class="mt-2 text-slate-600">
            @if (mode() === 'signIn') {
              New here?
              <button
                type="button"
                class="font-medium text-wp-700 underline"
                (click)="switchTo('signUp')"
              >
                Create an account
              </button>
            } @else {
              Already have an account?
              <button
                type="button"
                class="font-medium text-wp-700 underline"
                (click)="switchTo('signIn')"
              >
                Sign in
              </button>
            }
          </p>

          <form class="mt-8 space-y-5" novalidate (submit)="go($event)">
            <div>
              <label class="field-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="field-input"
                autocomplete="email"
                [formField]="f.email"
                [attr.aria-invalid]="invalid(f.email)"
                aria-describedby="email-error"
              />
              <app-field-error [field]="f.email" errorId="email-error" />
            </div>

            <div>
              <label class="field-label" for="password">Password</label>
              <input
                id="password"
                type="password"
                class="field-input"
                [attr.autocomplete]="mode() === 'signIn' ? 'current-password' : 'new-password'"
                [formField]="f.password"
                [attr.aria-invalid]="invalid(f.password)"
                aria-describedby="password-hint password-error"
              />
              @if (mode() === 'signUp') {
                <p id="password-hint" class="mt-1 text-xs text-slate-600">
                  At least {{ minPassword }} characters.
                </p>
              }
              <app-field-error [field]="f.password" errorId="password-error" />
            </div>

            @if (error(); as message) {
              <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
                {{ message }}
              </p>
            }

            <button type="submit" class="btn-primary w-full py-3" [disabled]="pending()">
              {{ submitLabel() }}
            </button>
          </form>

          @if (auth.kind === 'mock') {
            <p class="mt-10 rounded-md bg-wp-50 p-3 text-xs text-wp-900">
              Demo mode: everything is simulated in your browser, any email and password work.
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

  protected readonly baseDomain = APP_CONFIG.baseDomain;
  protected readonly minPassword = MIN_PASSWORD;
  protected readonly invalid = showInvalid;

  protected readonly mode = signal<Mode>('signIn');
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly model = signal({ email: '', password: '' });
  protected readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Enter your email.' });
    email(p.email, { message: 'Enter a valid email.' });
    required(p.password, { message: 'Enter your password.' });
    minLength(p.password, MIN_PASSWORD, { message: `Use at least ${MIN_PASSWORD} characters.` });
    maxLength(p.password, MAX_PASSWORD, { message: `Use at most ${MAX_PASSWORD} characters.` });
  });

  protected readonly submitLabel = computed(() => {
    if (this.mode() === 'signIn') return this.pending() ? 'Signing in…' : 'Sign in';
    return this.pending() ? 'Creating your account…' : 'Create account';
  });

  protected switchTo(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  protected async go(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.f, {
      action: async () => {
        this.pending.set(true);
        this.error.set(null);
        try {
          const credentials = this.model();
          await (this.mode() === 'signIn'
            ? this.auth.signIn(credentials)
            : this.auth.signUp(credentials));
          // The guards send a first-time user to /welcome.
          await this.router.navigateByUrl('/sites');
        } catch (error) {
          this.error.set(
            error instanceof GraphQlError && error.code && USER_FACING_CODES.includes(error.code)
              ? error.message
              : 'Something went wrong. Please try again.',
          );
        } finally {
          this.pending.set(false);
        }
        return undefined;
      },
    });
  }
}
