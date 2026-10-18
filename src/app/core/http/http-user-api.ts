import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserApi } from '../api/user-api';
import { ProfileInput, UserProfile } from '../models';

const USER_FIELDS = 'id email name lastname company tenant';

interface GraphQlResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** UserService over GraphQL (`POST /graphql`). */
@Service()
export class HttpUserApi extends UserApi {
  private readonly http = inject(HttpClient);

  async me(): Promise<UserProfile> {
    return (await this.query<{ me: UserProfile }>(`query { me { ${USER_FIELDS} } }`)).me;
  }

  async patchMe(input: ProfileInput): Promise<UserProfile> {
    const mutation = `mutation PatchMe($input: PatchUserInput!) { patchMe(input: $input) { ${USER_FIELDS} } }`;
    return (await this.query<{ patchMe: UserProfile }>(mutation, { input })).patchMe;
  }

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await firstValueFrom(
      this.http.post<GraphQlResponse<T>>(`${environment.apiBaseUrl}/graphql`, { query, variables }),
    );
    if (response.errors?.length || !response.data) {
      throw new Error(response.errors?.[0]?.message ?? 'GraphQL request failed.');
    }
    return response.data;
  }
}
