import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/api/auth.service';
import { ProfileStore } from '../core/profile.store';
import { SitesStore } from '../core/sites.store';
import { BrandMark } from './brand-mark';

@Component({
  selector: 'app-header',
  imports: [BrandMark],
  template: `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <app-brand-mark class="text-wp-700" />
        <div class="flex items-center gap-3">
          @if (profile.profile(); as p) {
            <div class="hidden text-right sm:block">
              <p class="text-sm font-medium text-slate-900">{{ profile.displayName() }}</p>
              <p class="text-xs text-slate-600">{{ p.company || p.email }}</p>
            </div>
          }
          <button type="button" class="btn-ghost" (click)="signOut()">Sign out</button>
        </div>
      </div>
    </header>
  `,
})
export class AppHeader {
  protected readonly profile = inject(ProfileStore);
  private readonly auth = inject(AuthService);
  private readonly sites = inject(SitesStore);
  private readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    this.sites.stop();
    this.profile.clear();
    await this.router.navigateByUrl('/login');
  }
}
