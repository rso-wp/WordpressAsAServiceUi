import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { siteHost, SITE_NAME_PATTERN, tenantSlug } from './core/naming';

describe('App', () => {
  it('should create the app', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe('naming', () => {
  it('turns a company into a tenant slug', () => {
    expect(tenantSlug('Acme Corp.')).toBe('acme-corp');
    expect(tenantSlug('  Čokolada d.o.o. ')).toBe('cokolada-d-o-o');
    expect(tenantSlug('')).toBe('tenant');
  });

  it('builds the site host', () => {
    expect(siteHost('blog', 'acme')).toBe('blog.acme.mydomain.com');
  });

  it('accepts DNS labels only', () => {
    expect(SITE_NAME_PATTERN.test('my-blog')).toBe(true);
    expect(SITE_NAME_PATTERN.test('My_Blog')).toBe(false);
    expect(SITE_NAME_PATTERN.test('-blog')).toBe(false);
  });
});
