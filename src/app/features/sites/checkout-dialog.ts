import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { PaymentApi } from '../../core/api/payment-api';
import { APP_CONFIG } from '../../core/config';
import { NewCardInput, PaymentCard, PaymentConfig, UserFacingError } from '../../core/models';
import { siteHost } from '../../core/naming';
import { SitesStore } from '../../core/sites.store';
import { FieldError, showInvalid } from '../../shared/field-error';
import { StripeCardForm } from './stripe-card-form';

const NEW_CARD = 'new';
const EMPTY_CARD: NewCardInput = { holder: '', number: '', expiry: '', cvc: '' };

/**
 * Pick a saved card or add one, then start the subscription. Starting fails fast (declined card, name taken) and the
 * dialog stays open with the reason; on success provisioning continues in the background.
 * New cards go through Stripe Elements, or through the fake card form when PaymentService runs with the fake gateway.
 */
@Component({
  selector: 'app-checkout-dialog',
  imports: [FormField, FieldError, StripeCardForm],
  template: `
    <dialog
      #dialog
      class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-white p-0 shadow-2xl"
      aria-labelledby="checkout-title"
      (cancel)="busy() && $event.preventDefault()"
      (close)="opened.set(false)"
    >
      @if (opened()) {
        <form novalidate (submit)="confirm($event)">
          <div class="border-b border-slate-200 px-6 py-5">
            <h2 id="checkout-title" class="text-lg font-semibold text-slate-900">
              Start your site
            </h2>
            <p class="mt-1 text-sm break-all text-slate-600">{{ host() }}</p>
          </div>

          <div class="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">
            <dl class="flex items-center justify-between rounded-lg bg-wp-50 px-4 py-3 text-sm">
              <dt class="text-wp-900">WordPress + database</dt>
              <dd class="font-semibold text-wp-900">{{ price }}</dd>
            </dl>

            <fieldset>
              <legend class="field-label">Payment method</legend>
              @if (loading()) {
                <p class="text-sm text-slate-600">Loading your cards…</p>
              } @else {
                <div class="mt-2 space-y-2">
                  @for (card of cards(); track card.id) {
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                      [class]="
                        selected() === card.id ? 'border-wp-500 bg-wp-50' : 'border-slate-300'
                      "
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        class="size-4 accent-wp-500"
                        [value]="card.id"
                        [checked]="selected() === card.id"
                        (change)="select(card.id)"
                      />
                      <span class="font-medium text-slate-900"
                        >{{ card.brand }} •••• {{ card.last4 }}</span
                      >
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

            @if (selected() === newCard && paymentConfig(); as config) {
              <div class="rounded-lg border border-slate-200 p-4">
                @if (config.mode === 'stripe') {
                  <app-stripe-card-form [publishableKey]="config.publishableKey" />
                } @else {
                  <div class="space-y-4">
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
                      Test payments: no real card is charged. A card ending in 0002 is declined.
                    </p>
                  </div>
                }
              </div>
            }

            @if (error(); as message) {
              <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
                {{ message }}
              </p>
            }
          </div>

          <div class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <!-- mousedown keeps focus in the card field: a blur would show its validation message and push this
                 button away before the click lands. -->
            <button
              type="button"
              class="btn-ghost"
              [disabled]="busy()"
              (mousedown)="$event.preventDefault()"
              (click)="close()"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="busy() || loading()">
              {{ busyLabel() ?? 'Subscribe and start' }}
            </button>
          </div>
        </form>
      }
    </dialog>
  `,
})
export class CheckoutDialog {
  private readonly payments = inject(PaymentApi);
  private readonly sites = inject(SitesStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stripeForm = viewChild(StripeCardForm);

  readonly tenant = input.required<string>();
  readonly started = output<string>();

  protected readonly newCard = NEW_CARD;
  protected readonly price = APP_CONFIG.monthlyPrice;
  protected readonly invalid = showInvalid;

  /** Rendering the content only while open recreates the Stripe element (and its setup intent) per checkout. */
  protected readonly opened = signal(false);
  protected readonly siteName = signal('');
  protected readonly host = computed(() => siteHost(this.siteName(), this.tenant()));
  protected readonly paymentConfig = signal<PaymentConfig | null>(null);
  protected readonly cards = signal<PaymentCard[]>([]);
  protected readonly loading = signal(false);
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
    this.opened.set(true);
    this.dialog().nativeElement.showModal();

    this.loading.set(true);
    try {
      const [config, cards] = await Promise.all([
        this.payments.config(),
        this.payments.listCards(),
      ]);
      this.paymentConfig.set(config);
      this.cards.set(cards);
      this.selected.set(cards[0]?.id ?? NEW_CARD);
    } catch {
      this.error.set('Your payment methods could not be loaded. Please try again.');
    } finally {
      this.loading.set(false);
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
    if (this.busy() || this.loading()) return;
    this.error.set(null);

    let paymentMethodId = this.selected();
    if (paymentMethodId === NEW_CARD) {
      const saved = await this.saveNewCard();
      if (!saved) return;
      paymentMethodId = saved;
    }

    this.busyLabel.set('Starting subscription…');
    try {
      await this.sites.start(this.siteName(), paymentMethodId);
      this.close();
      this.started.emit(this.siteName());
    } catch (e) {
      this.error.set(
        e instanceof UserFacingError
          ? e.message
          : 'The subscription could not be started. Please try again.',
      );
    } finally {
      this.busyLabel.set(null);
    }
  }

  /** Saves the new card (Stripe or fake) and selects it. Returns its id, or null if it was not saved. */
  private async saveNewCard(): Promise<string | null> {
    const stripeForm = this.stripeForm();
    if (!stripeForm) {
      const valid = await submit(this.card, { action: async () => undefined });
      if (!valid) return null;
    }

    this.busyLabel.set('Saving card…');
    try {
      const id = stripeForm
        ? await stripeForm.confirm()
        : (await this.payments.addFakeCard(this.cardModel())).id;
      this.cards.set(await this.payments.listCards());
      this.selected.set(id);
      return id;
    } catch (e) {
      this.error.set(
        e instanceof UserFacingError
          ? e.message
          : 'Your card could not be saved. Check the details and try again.',
      );
      return null;
    } finally {
      this.busyLabel.set(null);
    }
  }
}
