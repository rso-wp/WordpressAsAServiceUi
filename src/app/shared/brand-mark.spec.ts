import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../core/config';
import { APP_VERSION } from '../core/version';
import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  it('shows the product name and the version next to it', async () => {
    await TestBed.configureTestingModule({ imports: [BrandMark] }).compileComponents();
    const fixture = TestBed.createComponent(BrandMark);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(APP_CONFIG.productName);
    expect(text).toContain(APP_VERSION);
    expect(text.indexOf(APP_CONFIG.productName)).toBeLessThan(text.indexOf(APP_VERSION));
  });

  it('says what the version label is', async () => {
    await TestBed.configureTestingModule({ imports: [BrandMark] }).compileComponents();
    const fixture = TestBed.createComponent(BrandMark);
    await fixture.whenStable();

    const label = (fixture.nativeElement as HTMLElement).querySelector(`[title="Version ${APP_VERSION}"]`);
    expect(label?.textContent?.trim()).toBe(APP_VERSION);
  });
});
