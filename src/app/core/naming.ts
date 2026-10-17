import { APP_CONFIG } from './config';

/** Same rule as ProvisioningService: a DNS label of at most 30 characters. */
export const SITE_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]{0,28}[a-z0-9])?$/;

/** Turns a company name into the tenant part of the host name ("Acme Corp." -> "acme-corp"). */
export function tenantSlug(company: string | null | undefined): string {
  const slug = (company ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '');
  return slug || 'tenant';
}

export function siteHost(siteName: string, tenant: string): string {
  return `${siteName}.${tenant}.${APP_CONFIG.baseDomain}`;
}
