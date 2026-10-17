import { Component, input } from '@angular/core';
import { APP_CONFIG } from '../core/config';

@Component({
  selector: 'app-brand-mark',
  template: `
    <span class="inline-flex items-center gap-2.5">
      <span
        class="grid size-9 place-items-center rounded-lg font-bold"
        [class]="inverted() ? 'bg-white text-wp-700' : 'bg-wp-500 text-white'"
        aria-hidden="true"
        >P</span
      >
      <span class="text-lg font-semibold tracking-tight">{{ name }}</span>
    </span>
  `,
})
export class BrandMark {
  /** White mark for use on the blue background. */
  readonly inverted = input(false);
  protected readonly name = APP_CONFIG.productName;
}
