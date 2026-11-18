/** A random version 4 UUID from `crypto.getRandomValues`, which (unlike `crypto.randomUUID`) every browser offers on plain http. */
export function uuidV4(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Browsers only have `crypto.randomUUID` on https and localhost ("secure contexts"), and keycloak-js calls it for the `state` and
 * `nonce` of every sign-in. On plain http this adds it, built from `getRandomValues`. Does nothing where it exists.
 */
export function ensureRandomUuid(): void {
  if (typeof crypto.randomUUID === 'function') return;
  Object.defineProperty(crypto, 'randomUUID', { value: uuidV4, configurable: true });
}
