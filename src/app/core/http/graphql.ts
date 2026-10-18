import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface GraphQlResponse<T> {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
}

/** The first error of a GraphQL response. UserService sets `code` (e.g. `EMAIL_TAKEN`) and a user-facing message. */
export class GraphQlError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
  }
}

/** Codes that mean the session is no longer valid. */
export const SESSION_ERROR_CODES = ['AUTH_NOT_AUTHENTICATED', 'USER_NOT_FOUND'];

/** `POST /graphql` (UserService). Throws {@link GraphQlError} when the response has errors. */
export async function postGraphQl<T>(
  http: HttpClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await firstValueFrom(
    http.post<GraphQlResponse<T>>(`${environment.apiBaseUrl}/graphql`, { query, variables }),
  );
  const error = response.errors?.[0];
  if (error || !response.data) {
    throw new GraphQlError(
      error?.message ?? 'GraphQL request failed.',
      error?.extensions?.code ?? null,
    );
  }
  return response.data;
}
