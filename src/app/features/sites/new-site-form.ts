import { Component, input, output, signal } from '@angular/core';
import { form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { APP_CONFIG } from '../../core/config';
import { SITE_NAME_PATTERN } from '../../core/naming';
import { FieldError, showInvalid } from '../../shared/field-error';

/** Site name with a live preview of its address. Emits the name; payment happens in the checkout dialog. */
@Component({
  selector: 'app-new-site-form',
  imports: [FormField, FieldError],
  template: `
    <form class="space-y-4" novalidate (submit)="continue($event)">
      <div>
        <label class="field-label" for="site-name">Site name</label>
        <div
          class="flex rounded-md border border-slate-400 bg-white focus-within:border-wp-500 focus-within:ring-2 focus-within:ring-wp-200"
          [class.border-red-700]="invalid(f.name)"
        >
          <input
            id="site-name"
            class="min-w-0 flex-1 rounded-l-md bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
            placeholder="my-blog"
            autocomplete="off"
            spellcheck="false"
            [formField]="f.name"
            [attr.aria-invalid]="invalid(f.name)"
            aria-describedby="site-name-hint site-name-error"
          />
          <span
            class="hidden items-center rounded-r-md border-l border-slate-300 bg-slate-50 px-3 text-sm text-slate-600 sm:flex"
            aria-hidden="true"
            >.{{ tenant() }}.{{ baseDomain }}</span
          >
        </div>
        <p id="site-name-hint" class="mt-1 text-sm text-slate-600">
          Lowercase letters, numbers and hyphens, up to 30 characters. Your site's address will be
          <span class="font-medium break-words text-wp-700">{{ preview() }}</span>
        </p>
        <app-field-error [field]="f.name" errorId="site-name-error" />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-600">WordPress with its own database · {{ price }}</p>
        <button type="submit" class="btn-primary">Continue to payment</button>
      </div>
    </form>
  `,
})
export class NewSiteForm {
  readonly tenant = input.required<string>();
  /** Names the user already uses; the backend would reject them with 409. */
  readonly existingNames = input<readonly string[]>([]);
  readonly requested = output<string>();

  protected readonly baseDomain = APP_CONFIG.baseDomain;
  protected readonly price = APP_CONFIG.monthlyPrice;
  protected readonly invalid = showInvalid;

  private readonly model = signal({ name: '' });

  protected readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Give your site a name.' });
    pattern(p.name, SITE_NAME_PATTERN, {
      message:
        'Use lowercase letters, numbers and hyphens (not at the start or end), up to 30 characters.',
    });
    validate(p.name, ({ value }) =>
      this.existingNames().includes(value())
        ? { kind: 'taken', message: 'You already have a site with this name.' }
        : undefined,
    );
  });

  protected preview(): string {
    return `${this.model().name || 'your-site'}.${this.tenant()}.${this.baseDomain}`;
  }

  protected async continue(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.f, {
      action: async () => {
        this.requested.emit(this.model().name);
        return undefined;
      },
    });
  }

  reset(): void {
    this.f().reset({ name: '' });
  }
}
