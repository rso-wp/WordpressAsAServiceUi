/** App-wide settings. Move to environment files once there is more than one environment. */
export const APP_CONFIG = {
  productName: 'PressHost',
  /** Sites are served at <site>.<tenant>.<baseDomain>. */
  baseDomain: 'mydomain.com',
  monthlyPrice: '€9 / month',
} as const;
