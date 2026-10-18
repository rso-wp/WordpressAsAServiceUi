import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { PaymentApi } from '../../core/api/payment-api';
import { UserFacingError } from '../../core/models';

/**
 * Stripe Payment Element: the card is entered in Stripe's iframe and saved to the user's Stripe customer through a
 * setup intent, so card numbers never touch our app or servers.
 */
@Component({
  selector: 'app-stripe-card-form',
  template: `
    @if (loading()) {
      <p class="text-sm text-slate-600">Loading the secure card form…</p>
    }
    @if (loadError(); as message) {
      <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message }}</p>
    }
    <div #host></div>
  `,
})
export class StripeCardForm {
  readonly publishableKey = input.required<string>();

  private readonly payments = inject(PaymentApi);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    afterNextRender(() => void this.mount());
  }

  /** Saves the entered card on the user's Stripe customer and returns its payment method id. */
  async confirm(): Promise<string> {
    if (!this.stripe || !this.elements)
      throw new UserFacingError('The card form is not ready yet.');

    const { error, setupIntent } = await this.stripe.confirmSetup({
      elements: this.elements,
      redirect: 'if_required',
    });
    if (error) throw new UserFacingError(error.message ?? 'Your card could not be saved.');

    const paymentMethod = setupIntent.payment_method;
    if (!paymentMethod) throw new UserFacingError('Your card could not be saved.');
    return typeof paymentMethod === 'string' ? paymentMethod : paymentMethod.id;
  }

  private async mount(): Promise<void> {
    try {
      const [stripe, clientSecret] = await Promise.all([
        loadStripe(this.publishableKey()),
        this.payments.createSetupIntent(),
      ]);
      if (!stripe) throw new Error('Stripe.js did not load.');

      this.stripe = stripe;
      this.elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#2271b1', borderRadius: '6px' },
        },
      });
      this.elements.create('payment').mount(this.host().nativeElement);
    } catch {
      this.loadError.set('The card form could not be loaded. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
