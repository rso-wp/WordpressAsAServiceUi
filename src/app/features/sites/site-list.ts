import { DatePipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { ProvisionedSite } from '../../core/models';
import { siteHost } from '../../core/naming';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-site-list',
  imports: [DatePipe, StatusBadge],
  template: `
    @if (sites().length === 0) {
      <div class="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
        <p class="font-medium text-slate-900">No sites yet</p>
        <p class="mt-1 text-sm text-slate-600">Your first WordPress site is one name and one card away.</p>
      </div>
    } @else {
      <ul class="card divide-y divide-slate-200">
        @for (site of sites(); track site.name) {
          <li class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="font-semibold text-slate-900">{{ site.name }}</h3>
                <app-status-badge [status]="site.provisioningStatus" />
              </div>

              @if (site.url && site.provisioningStatus === 'Provisioned') {
                <a
                  class="mt-1 inline-block text-sm break-all text-wp-600 underline-offset-2 hover:underline"
                  [href]="site.url"
                  target="_blank"
                  rel="noopener"
                >
                  {{ hostOf(site) }}<span class="sr-only"> (opens in a new tab)</span>
                </a>
              } @else {
                <p class="mt-1 text-sm break-all text-slate-600">{{ hostOf(site) }}</p>
              }

              @if (site.provisioningStatus === 'Failed') {
                <p class="mt-2 text-sm text-red-800">
                  Setting up this site failed. Delete it to free the name and try again.
                </p>
              } @else if (site.provisioningStatus === 'Queued') {
                <p class="mt-2 text-sm text-slate-600">Creating the database and starting WordPress…</p>
              }

              <p class="mt-2 text-xs text-slate-600">Started {{ site.startDate | date: 'medium' }}</p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              @if (site.url && site.provisioningStatus === 'Provisioned') {
                <a class="btn-secondary" [href]="site.url + '/wp-admin'" target="_blank" rel="noopener">
                  WP Admin<span class="sr-only"> for {{ site.name }} (opens in a new tab)</span>
                </a>
              }
              @if (site.provisioningStatus !== 'Deleting') {
                @if (confirming() === site.name) {
                  <button type="button" class="btn-ghost" (click)="confirming.set(null)">Keep</button>
                  <button
                    type="button"
                    class="inline-flex items-center rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                    (click)="confirmDelete(site.name)"
                  >
                    Delete {{ site.name }}
                  </button>
                } @else {
                  <button type="button" class="btn-ghost text-red-700" (click)="confirming.set(site.name)">
                    Delete<span class="sr-only"> {{ site.name }}</span>
                  </button>
                }
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class SiteList {
  readonly sites = input.required<readonly ProvisionedSite[]>();
  readonly tenant = input.required<string>();
  readonly deleteRequested = output<string>();

  protected readonly confirming = signal<string | null>(null);

  protected hostOf(site: ProvisionedSite): string {
    return site.url ? site.url.replace(/^https?:\/\//, '') : siteHost(site.name, this.tenant());
  }

  protected confirmDelete(name: string): void {
    this.confirming.set(null);
    this.deleteRequested.emit(name);
  }
}
