import { Component, computed, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { ProvisioningStatus } from '../../core/models';
import { ProfileStore } from '../../core/profile.store';
import { SitesStore } from '../../core/sites.store';
import { AppHeader } from '../../shared/app-header';
import { CheckoutDialog } from './checkout-dialog';
import { NewSiteForm } from './new-site-form';
import { SiteList } from './site-list';

const ANNOUNCE: Partial<Record<ProvisioningStatus, string>> = {
  Provisioned: 'is ready',
  Failed: 'could not be set up',
};

@Component({
  selector: 'app-sites-page',
  imports: [AppHeader, NewSiteForm, CheckoutDialog, SiteList],
  template: `
    <app-header />

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 class="text-2xl font-semibold text-slate-900">Hi {{ firstName() }}</h1>
      <p class="mt-1 text-slate-600">Start a new WordPress site or manage the ones you have.</p>

      <section class="card mt-8 p-6" aria-labelledby="new-site-title">
        <h2 id="new-site-title" class="mb-4 text-lg font-semibold text-slate-900">Start a new site</h2>
        <app-new-site-form
          [tenant]="profile.tenant()"
          [existingNames]="siteNames()"
          (requested)="checkout.open($event)"
        />
      </section>

      <section class="mt-10" aria-labelledby="sites-title">
        <div class="mb-4 flex items-center justify-between">
          <h2 id="sites-title" class="text-lg font-semibold text-slate-900">Your sites</h2>
          @if (store.inProgress()) {
            <p class="text-sm text-slate-600">Updating automatically…</p>
          }
        </div>

        @if (store.loadError(); as message) {
          <p class="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{{ message }}</p>
        }

        @if (!store.loaded()) {
          <p class="text-sm text-slate-600">Loading your sites…</p>
        } @else {
          <app-site-list
            [sites]="store.sites()"
            [tenant]="profile.tenant()"
            (deleteRequested)="remove($event)"
          />
        }
      </section>

      <p class="sr-only" aria-live="polite">{{ announcement() }}</p>
    </main>

    <app-checkout-dialog #checkout [tenant]="profile.tenant()" (started)="onStarted($event)" />
  `,
})
export class SitesPage implements OnInit {
  protected readonly profile = inject(ProfileStore);
  protected readonly store = inject(SitesStore);
  private readonly newSiteForm = viewChild.required(NewSiteForm);

  protected readonly firstName = computed(() => this.profile.profile()?.name ?? '');
  protected readonly siteNames = computed(() => this.store.sites().map((s) => s.name));
  protected readonly announcement = signal('');

  constructor() {
    // Tell screen reader users when a site finishes setting up (the badge changes silently otherwise).
    const previous = new Map<string, ProvisioningStatus>();
    effect(() => {
      for (const site of this.store.sites()) {
        const before = previous.get(site.name);
        const message = ANNOUNCE[site.provisioningStatus];
        if (before === 'Queued' && message) this.announcement.set(`${site.name} ${message}.`);
        previous.set(site.name, site.provisioningStatus);
      }
    });
  }

  ngOnInit(): void {
    void this.store.refresh();
  }

  protected onStarted(name: string): void {
    this.newSiteForm().reset();
    this.announcement.set(`Subscription started. ${name} is being set up.`);
  }

  protected async remove(name: string): Promise<void> {
    try {
      await this.store.remove(name);
      this.announcement.set(`${name} is being removed.`);
    } catch {
      this.announcement.set(`${name} could not be removed. Please try again.`);
    }
  }
}
