import { Environment } from './environment.model';

/** `npm run start:mock`: no backend at all; everything is simulated in the browser (localStorage). */
export const environment: Environment = {
  backend: 'mock',
  apiBaseUrl: '',
  auth: { mode: 'mock' },
};
