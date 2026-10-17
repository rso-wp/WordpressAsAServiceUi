import { Routes } from '@angular/router';
import { memberGuard, signedOutGuard, welcomeGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sites' },
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'welcome',
    title: 'Welcome',
    canActivate: [welcomeGuard],
    loadComponent: () => import('./features/welcome/welcome-page').then((m) => m.WelcomePage),
  },
  {
    path: 'sites',
    title: 'Your sites',
    canActivate: [memberGuard],
    loadComponent: () => import('./features/sites/sites-page').then((m) => m.SitesPage),
  },
  { path: '**', redirectTo: 'sites' },
];
