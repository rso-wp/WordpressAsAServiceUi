import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { APP_CONFIG } from '../../core/config';
import { ProfileInput } from '../../core/models';
import { tenantSlug } from '../../core/naming';
import { ProfileStore } from '../../core/profile.store';
import { BrandMark } from '../../shared/brand-mark';
import { FieldError, showInvalid } from '../../shared/field-error';

/** First sign-in: the user fills in name, last name and company. */
@Component({
  selector: 'app-welcome-page',
  imports: [BrandMark, FormField, FieldError],
  template: `
    <div class="min-h-screen bg-wp-50 px-4 py-10 sm:py-16">
      <div class="mx-auto max-w-lg">
        <header class="mb-8">
          <app-brand-mark class="block text-wp-700" />
        </header>

        <main class="card p-6 sm:p-8">
          <h1 class="text-2xl font-semibold text-slate-900">Tell us about you</h1>
          <p class="mt-2 text-slate-600">
            You are signed in as <span class="font-medium text-slate-800">{{ email() }}</span
            >. We need a few details before you create your first site.
          </p>

          <form class="mt-8 space-y-5" novalidate (submit)="save($event)">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="field-label" for="name">First name</label>
                <input
                  id="name"
                  class="field-input"
                  autocomplete="given-name"
                  [formField]="f.name"
                  [attr.aria-invalid]="invalid(f.name)"
                  aria-describedby="name-error"
                />
                <app-field-error [field]="f.name" errorId="name-error" />
              </div>
              <div>
                <label class="field-label" for="lastname">Last name</label>
                <input
                  id="lastname"
                  class="field-input"
                  autocomplete="family-name"
                  [formField]="f.lastname"
                  [attr.aria-invalid]="invalid(f.lastname)"
                  aria-describedby="lastname-error"
                />
                <app-field-error [field]="f.lastname" errorId="lastname-error" />
              </div>
            </div>

            <div>
              <label class="field-label" for="company">Company</label>
              <input
                id="company"
                class="field-input"
                autocomplete="organization"
                [formField]="f.company"
                [attr.aria-invalid]="invalid(f.company)"
                aria-describedby="company-hint company-error"
              />
              <p id="company-hint" class="mt-1 text-sm text-slate-600">
                Your sites will live at
                <span class="font-medium text-wp-700">*.{{ tenant() }}.{{ baseDomain }}</span>
              </p>
              <app-field-error [field]="f.company" errorId="company-error" />
            </div>

            @if (error(); as message) {
              <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message }}</p>
            }

            <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" class="btn-ghost" (click)="signOut()">Sign out</button>
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Continue' }}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  `,
})
export class WelcomePage {
  private readonly profile = inject(ProfileStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly baseDomain = APP_CONFIG.baseDomain;
  protected readonly email = computed(() => this.profile.profile()?.email ?? '');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly model = signal<ProfileInput>({
    name: this.profile.profile()?.name ?? '',
    lastname: this.profile.profile()?.lastname ?? '',
    company: this.profile.profile()?.company ?? '',
  });

  protected readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Enter your first name.' });
    maxLength(p.name, 255, { message: 'Use at most 255 characters.' });
    required(p.lastname, { message: 'Enter your last name.' });
    maxLength(p.lastname, 255, { message: 'Use at most 255 characters.' });
    required(p.company, { message: 'Enter your company.' });
    maxLength(p.company, 255, { message: 'Use at most 255 characters.' });
  });

  protected readonly tenant = computed(() => tenantSlug(this.model().company));
  protected readonly invalid = showInvalid;

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.f, {
      action: async () => {
        this.saving.set(true);
        this.error.set(null);
        try {
          const { name, lastname, company } = this.model();
          await this.profile.save({ name: name.trim(), lastname: lastname.trim(), company: company.trim() });
          await this.router.navigateByUrl('/sites');
        } catch {
          this.error.set('Your details could not be saved. Please try again.');
        } finally {
          this.saving.set(false);
        }
        return undefined;
      },
    });
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    this.profile.clear();
    await this.router.navigateByUrl('/login');
  }
}
