import { Component, computed, input } from '@angular/core';
import { inProgress, ProvisioningStatus } from '../core/models';

const LOOK: Record<ProvisioningStatus, { label: string; classes: string }> = {
  PendingPayment: { label: 'Confirming payment', classes: 'bg-amber-50 text-amber-900 ring-amber-300' },
  Queued: { label: 'Setting up', classes: 'bg-amber-50 text-amber-900 ring-amber-300' },
  Provisioned: { label: 'Running', classes: 'bg-green-50 text-green-800 ring-green-300' },
  Failed: { label: 'Failed', classes: 'bg-red-50 text-red-800 ring-red-300' },
  Deleting: { label: 'Removing', classes: 'bg-slate-100 text-slate-700 ring-slate-300' },
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset"
      [class]="look().classes"
    >
      @if (working()) {
        <span
          class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      } @else {
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      }
      {{ look().label }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<ProvisioningStatus>();
  protected readonly look = computed(() => LOOK[this.status()]);
  protected readonly working = computed(() => inProgress(this.status()));
}
