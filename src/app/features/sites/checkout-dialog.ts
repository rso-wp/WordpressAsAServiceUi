import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { PaymentApi } from '../../core/api/payment-api';
import { APP_CONFIG } from '../../core/config';
import {
  NewCardInput,
  PaymentCard,
  SiteNameTakenError,
  SubscriptionDeclinedError,
} from '../../core/models';
import { siteHost } from '../../core/naming';
import { SitesStore } from '../../core/sites.store';
import { FieldError, showInvalid } from '../../shared/field-error';

const NEW_CARD = 'new';
const EMPTY_CARD: NewCardInput = { holder: '', number: '', expiry: '', cvc: '' };

/**
 * Pick a saved card or add one, then start the subscription. Starting fails fast (declined card, name taken) and the
 * dialog stays open with the reason; on success provisioning continues in the background.
 */
@Component({
  selector: 'app-checkout-dialog',
  imports: [FormField, FieldError],
  template: `
    <dialog
      #dialog
      class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-white p-0 shadow-2xl"
      aria-labelledby="checkout-title"
      (cancel)="busy() && $event.preventDefault()"
    >
      <form novalidate (submit)="confirm($event)">
        <div class="border-b border-slate-200 px-6 py-5">
          <h2 id="checkout-title" class="text-lg font-semibold text-slate-900">Start your site</h2>
          <p class="mt-1 text-sm break-all text-slate-600">{{ host() }}</p>
        </div>

        <div class="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">
          <dl class="flex items-center justify-between rounded-lg bg-wp-50 px-4 py-3 text-sm">
            <dt class="text-wp-900">WordPress + database</dt>
            <dd class="font-semibold text-wp-900">{{ price }}</dd>
          </dl>

          <fieldset>
            <legend class="field-label">Payment method</legend>
            @if (loadingCards()) {
              <p class="text-sm text-slate-600">Loading your cards…</p>
            } @else {
              <div class="mt-2 space-y-2">
                @for (card of cards(); track card.id) {
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                    [class]="selected() === card.id ? 'border-wp-500 bg-wp-50' : 'border-slate-300'"
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      class="size-4 accent-wp-500"
                      [value]="card.id"
                      [checked]="selected() === card.id"
                      (change)="select(card.id)"
                    />
                    <span class="font-medium text-slate-900">{{ card.brand }} •••• {{ card.last4 }}</span>
                    <span class="ml-auto text-slate-600">Expires {{ expiry(card) }}</span>
                  </label>
                }
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                  [class]="selected() === newCard ? 'border-wp-500 bg-wp-50' : 'border-slate-300'"
                >
                  <input
                    type="radio"
                    name="payment-method"
                    class="size-4 accent-wp-500"
                    [value]="newCard"
                    [checked]="selected() === newCard"
                    (change)="select(newCard)"
                  />
                  <span class="font-medium text-slate-900">Add a new card</span>
                </label>
              </div>
            }
          </fieldset>

          @if (selected() === newCard && !loadingCards()) {
            <div class="space-y-4 rounded-lg border border-slate-200 p-4">
              <div>
                <label class="field-label" for="card-holder">Name on card</label>
                <input
                  id="card-holder"
                  class="field-input"
                  autocomplete="cc-name"
                  [formField]="card.holder"
                  [attr.aria-invalid]="invalid(card.holder)"
                  aria-describedby="card-holder-error"
                />
                <app-field-error [field]="card.holder" errorId="card-holder-error" />
              </div>
              <div>
                <label class="field-label" for="card-number">Card number</label>
                <input
                  id="card-number"
                  class="field-input"
                  inputmode="numeric"
                  autocomplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  [formField]="card.number"
                  [attr.aria-invalid]="invalid(card.number)"
                  aria-describedby="card-number-error"
                />
                <app-field-error [field]="card.number" errorId="card-number-error" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="field-label" for="card-expiry">Expiry (MM/YY)</label>
                  <input
                    id="card-expiry"
                    class="field-input"
                    inputmode="numeric"
                    autocomplete="cc-exp"
                    placeholder="12/29"
                    [formField]="card.expiry"
                    [attr.aria-invalid]="invalid(card.expiry)"
                    aria-describedby="card-expiry-error"
                  />
                  <app-field-error [field]="card.expiry" errorId="card-expiry-error" />
                </div>
                <div>
                  <label class="field-label" for="card-cvc">CVC</label>
                  <input
                    id="card-cvc"
                    class="field-input"
                    inputmode="numeric"
                    autocomplete="cc-csc"
                    placeholder="123"
                    [formField]="card.cvc"
                    [attr.aria-invalid]="invalid(card.cvc)"
                    aria-describedby="card-cvc-error"
                  />
                  <app-field-error [field]="card.cvc" errorId="card-cvc-error" />
                </div>
              </div>
              <p class="text-xs text-slate-600">
                Demo: any valid-looking number works. A card ending in 0002 is declined.
              </p>
            </div>
          }

          @if (error(); as message) {
            <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message }}</p>
          }
        </div>

        <div class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" class="btn-ghost" [disabled]="busy()" (click)="close()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="busy() || loadingCards()">
            {{ busyLabel() ?? 'Subscribe and start' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class CheckoutDialog {
  private readonly payments = inject(PaymentApi);
  private readonly sites = inject(SitesStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly tenant = input.required<string>();
  readonly started = output<string>();

  protected readonly newCard = NEW_CARD;
  protected readonly price = APP_CONFIG.monthlyPrice;
  protected readonly invalid = showInvalid;

  protected readonly siteName = signal('');
  protected readonly host = computed(() => siteHost(this.siteName(), this.tenant()));
  protected readonly cards = signal<PaymentCard[]>([]);
  protected readonly loadingCards = signal(false);
  protected readonly selected = signal<string>(NEW_CARD);
  protected readonly busyLabel = signal<string | null>(null);
  protected readonly busy = computed(() => this.busyLabel() !== null);
  protected readonly error = signal<string | null>(null);

  private readonly cardModel = signal<NewCardInput>({ ...EMPTY_CARD });

  protected readonly card = form(this.cardModel, (p) => {
    required(p.holder, { message: 'Enter the name on the card.' });
    required(p.number, { message: 'Enter the card number.' });
    validate(p.number, ({ value }) =>
      /^\d{13,19}$/.test(value().replace(/[\s-]/g, ''))
        ? undefined
        : { kind: 'cardNumber', message: 'Enter a valid card number.' },
    );
    required(p.expiry, { message: 'Enter the expiry date.' });
    pattern(p.expiry, /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, { message: 'Use the format MM/YY.' });
    required(p.cvc, { message: 'Enter the CVC.' });
    pattern(p.cvc, /^\d{3,4}$/, { message: 'The CVC has 3 or 4 digits.' });
  });

  async open(siteName: string): Promise<void> {
    this.siteName.set(siteName);
    this.error.set(null);
    this.card().reset({ ...EMPTY_CARD });
    this.dialog().nativeElement.showModal();

    this.loadingCards.set(true);
    try {
      const cards = await this.payments.listCards();
      this.cards.set(cards);
      this.selected.set(cards[0]?.id ?? NEW_CARD);
    } catch {
      this.cards.set([]);
      this.selected.set(NEW_CARD);
    } finally {
      this.loadingCards.set(false);
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected select(id: string): void {
    this.selected.set(id);
    this.error.set(null);
  }

  protected expiry(card: PaymentCard): string {
    return `${String(card.expMonth).padStart(2, '0')}/${String(card.expYear).slice(-2)}`;
  }

  protected async confirm(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.error.set(null);

    let paymentMethodId = this.selected();
    if (paymentMethodId === NEW_CARD) {
      const valid = await submit(this.card, { action: async () => undefined });
      if (!valid) return;

      this.busyLabel.set('Saving card…');
      try {
        const saved = await this.payments.addCard(this.cardModel());
        this.cards.update((cards) => [saved, ...cards]);
        this.selected.set(saved.id);
        paymentMethodId = saved.id;
      } catch {
        this.error.set('Your card could not be saved. Check the details and try again.');
        this.busyLabel.set(null);
        return;
      }
    }

    this.busyLabel.set('Starting subscription…');
    try {
      await this.sites.start(this.siteName(), paymentMethodId);
      this.close();
      this.started.emit(this.siteName());
    } catch (e) {
      this.error.set(
        e instanceof SubscriptionDeclinedError || e instanceof SiteNameTakenError
          ? e.message
          : 'The subscription could not be started. Please try again.',
      );
    } finally {
      this.busyLabel.set(null);
    }
  }
}
