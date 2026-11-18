import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/api/auth.service';
import { LoginPage } from './login-page';

class FakeKeycloakAuth {
  readonly kind = 'keycloak' as const;
  signedIn = 0;
  signedUp = 0;
  async signIn(): Promise<void> {
    this.signedIn++;
  }
  async signUp(): Promise<void> {
    this.signedUp++;
  }
}

async function render(kind: 'keycloak' | 'mock') {
  const auth = kind === 'keycloak' ? new FakeKeycloakAuth() : { kind: 'mock' as const };
  await TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
  }).compileComponents();
  const fixture = TestBed.createComponent(LoginPage);
  await fixture.whenStable();
  return { fixture, auth, el: fixture.nativeElement as HTMLElement };
}

const button = (el: HTMLElement, text: string) =>
  Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);

describe('LoginPage', () => {
  it('with Keycloak: two buttons and no password form', async () => {
    const { el } = await render('keycloak');

    expect(button(el, 'Sign in')).toBeTruthy();
    expect(button(el, 'Create account')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeNull();
    expect(el.querySelector('form')).toBeNull();
  });

  it('"Sign in" sends the browser to Keycloak to sign in', async () => {
    const { el, auth } = await render('keycloak');

    button(el, 'Sign in')!.click();

    expect((auth as FakeKeycloakAuth).signedIn).toBe(1);
    expect((auth as FakeKeycloakAuth).signedUp).toBe(0);
  });

  it('"Create account" sends the browser to Keycloak to register', async () => {
    const { el, auth } = await render('keycloak');

    button(el, 'Create account')!.click();

    expect((auth as FakeKeycloakAuth).signedUp).toBe(1);
    expect((auth as FakeKeycloakAuth).signedIn).toBe(0);
  });

  it('demo mode still has the email and password form', async () => {
    const { el } = await render('mock');

    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.querySelector('form')).toBeTruthy();
  });
});
