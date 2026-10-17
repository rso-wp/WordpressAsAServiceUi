import { ProfileInput, UserProfile } from '../models';

/** UserService (GraphQL, `/graphql`). */
export abstract class UserApi {
  /** `query { me }`: returns the user, creating it on first sign-in (name/lastname/company still empty). */
  abstract me(): Promise<UserProfile>;

  /** `mutation { patchMe(input) }`. */
  abstract patchMe(input: ProfileInput): Promise<UserProfile>;
}
