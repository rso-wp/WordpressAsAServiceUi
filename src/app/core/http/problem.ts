import { HttpErrorResponse } from '@angular/common/http';

/** The `detail` of an RFC 9457 ProblemDetails response (the services put user-facing text there), if any. */
export function problemDetail(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body: unknown = error.error;
  if (typeof body === 'string') return body || null;
  if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string')
    return body.detail;
  return null;
}

export function statusOf(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}
