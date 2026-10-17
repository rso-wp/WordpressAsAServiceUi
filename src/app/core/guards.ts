import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './api/auth.service';
import { ProfileStore } from './profile.store';

/** Only for signed-out users (the sign-in page). */
export const signedOutGuard: CanActivateFn = () =>
  inject(AuthService).account() ? inject(Router).parseUrl('/sites') : true;

/** Signed in and profile filled in; first sign-in goes to the welcome page. */
export const memberGuard: CanActivateFn = async () => {
  const router = inject(Router);
  if (!inject(AuthService).account()) return router.parseUrl('/login');

  const profile = inject(ProfileStore);
  await profile.load();
  return profile.isComplete() ? true : router.parseUrl('/welcome');
};

/** The welcome page: signed in, profile not filled in yet. */
export const welcomeGuard: CanActivateFn = async () => {
  const router = inject(Router);
  if (!inject(AuthService).account()) return router.parseUrl('/login');

  const profile = inject(ProfileStore);
  await profile.load();
  return profile.isComplete() ? router.parseUrl('/sites') : true;
};
