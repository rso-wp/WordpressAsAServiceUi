import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/** First validation message of a field, shown once the field was touched. Link it with aria-describedby. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" [id]="errorId()">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<FieldTree<string>>();
  readonly errorId = input.required<string>();

  protected readonly message = computed(() => {
    const state = this.field()();
    return state.touched() && state.invalid() ? (state.errors()[0]?.message ?? 'Invalid value.') : null;
  });
}

/** True when the field should be announced as invalid (bind to aria-invalid). */
export function showInvalid(field: FieldTree<string>): boolean {
  const state = field();
  return state.touched() && state.invalid();
}
