import { ensureRandomUuid, uuidV4 } from './uuid';
import { keycloakConfig } from './keycloak-config';

describe('keycloakConfig', () => {
  const at = (protocol: string, host: string) =>
    keycloakConfig({ protocol, host, hostname: host.split(':')[0] });

  it('finds Keycloak next to the app, at keycloak.<host>', () => {
    expect(at('http:', '158-158-49-249.sslip.io').url).toBe('http://keycloak.158-158-49-249.sslip.io');
    expect(at('https:', 'app.example.com').url).toBe('https://keycloak.app.example.com');
  });

  it('keeps a port of the app host', () => {
    expect(at('http:', '10-0-0-1.sslip.io:8080').url).toBe('http://keycloak.10-0-0-1.sslip.io:8080');
  });

  it('uses the compose Keycloak when the app runs on this machine', () => {
    expect(at('http:', 'localhost:4200').url).toBe('http://localhost:8180');
    expect(at('http:', '127.0.0.1:4200').url).toBe('http://localhost:8180');
  });

  it('always uses the rso realm and the frontend client', () => {
    expect(at('http:', 'localhost:4200')).toMatchObject({ realm: 'rso', clientId: 'rso-frontend' });
  });
});

describe('uuid', () => {
  it('makes version 4 UUIDs', () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('makes a different one every time', () => {
    expect(new Set(Array.from({ length: 200 }, () => uuidV4())).size).toBe(200);
  });

  it('adds crypto.randomUUID where the browser has none (plain http)', () => {
    const original = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
    const prototype = Object.getPrototypeOf(crypto) as object;
    const inherited = Object.getOwnPropertyDescriptor(prototype, 'randomUUID');
    // Simulate an insecure context: the function is not there.
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      ensureRandomUuid();
      expect(crypto.randomUUID()).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      if (original) Object.defineProperty(crypto, 'randomUUID', original);
      else delete (crypto as unknown as Record<string, unknown>)['randomUUID'];
      expect(inherited ?? original).toBeDefined();
    }
  });

  it('leaves crypto.randomUUID alone where it exists', () => {
    const before = crypto.randomUUID;
    ensureRandomUuid();
    expect(crypto.randomUUID).toBe(before);
  });
});
