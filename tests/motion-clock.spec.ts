import { test, expect } from './fixtures';

test('sections reveal when scrolled into view', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact).not.toHaveClass(/\bin\b/);
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toHaveClass(/\bin\b/);
  await expect.poll(() => contact.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
});

test('deep link target is visible immediately', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.locator('#contact')).toHaveClass(/\bin\b/);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('unrevealed sections are still fully visible', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('#contact').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  });
  test('stack tab indicator does not animate', async ({ page }) => {
    await page.goto('/#stack');
    const d = await page.locator('.tab-indicator').evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(d.split(',').every((s) => parseFloat(s) === 0)).toBe(true);
  });
});

test('footer clock shows IST time for a frozen instant', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-04T08:30:00Z'));
  await page.goto('/');
  await expect(page.locator('time[data-clock]')).toHaveText('14:00 IST');
  await expect(page.locator('[data-year]')).toHaveText('2026');
});
