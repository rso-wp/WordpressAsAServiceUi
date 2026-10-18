import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../api/auth.service';

const API_PATHS = ['/graphql', '/payment-methods', '/provisions'];

/** Adds the sign-in headers (bearer token or DevAuth) to calls to our own APIs, and nothing else. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.startsWith(environment.apiBaseUrl)
    ? req.url.slice(environment.apiBaseUrl.length)
    : null;
  if (path === null || !API_PATHS.some((p) => path.startsWith(p))) return next(req);

  return from(inject(AuthService).requestHeaders()).pipe(
    switchMap((headers) => next(req.clone({ setHeaders: headers }))),
  );
};
