import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { AuthService, endSession } from '../api/auth.service';
import { UserApi } from '../api/user-api';
import { ProfileInput, UserProfile } from '../models';
import { GraphQlError, postGraphQl, SESSION_ERROR_CODES } from './graphql';

const USER_FIELDS = 'id email name lastname company tenant';

/** UserService over GraphQL (`POST /graphql`). */
@Service()
export class HttpUserApi extends UserApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async me(): Promise<UserProfile> {
    return (await this.query<{ me: UserProfile }>(`query { me { ${USER_FIELDS} } }`)).me;
  }

  async patchMe(input: ProfileInput): Promise<UserProfile> {
    const mutation = `mutation PatchMe($input: PatchUserInput!) { patchMe(input: $input) { ${USER_FIELDS} } }`;
    return (await this.query<{ patchMe: UserProfile }>(mutation, { input })).patchMe;
  }

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    try {
      return await postGraphQl<T>(this.http, query, variables);
    } catch (error) {
      // GraphQL reports a rejected token as an error in a 200 response, not as a 401.
      if (error instanceof GraphQlError && error.code && SESSION_ERROR_CODES.includes(error.code)) {
        await endSession(this.auth);
      }
      throw error;
    }
  }
}
