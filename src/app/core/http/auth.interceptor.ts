import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, endSession } from '../api/auth.service';

const API_PATHS = ['/graphql', '/payment-methods', '/provisions'];

/**
 * Adds the bearer token to calls to our own APIs, and nothing else. A 401 while signed in means the token expired:
 * the session ends and the user signs in again.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.startsWith(environment.apiBaseUrl)
    ? req.url.slice(environment.apiBaseUrl.length)
    : null;
  if (path === null || !API_PATHS.some((p) => path.startsWith(p))) return next(req);

  const auth = inject(AuthService);
  return from(auth.requestHeaders()).pipe(
    switchMap((headers) => next(req.clone({ setHeaders: headers }))),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && auth.account()) {
        void endSession(auth);
      }
      return throwError(() => error);
    }),
  );
};
