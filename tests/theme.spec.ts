import { test, expect } from './fixtures';

test('defaults to system: no data-theme attribute, js class set', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme');
  await expect(html).toHaveClass(/\bjs\b/);
});

test('stored theme applies before first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
});

test('footer toggle cycles system → light → dark → system and persists', async ({ page }) => {
  await page.goto('/');
  const btn = page.getByRole('button', { name: /Theme: system/ });
  await btn.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Theme: light/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: /Theme: dark/ }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
});

test('head has color-scheme, theme-color for both schemes, canonical and OG', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://achyuta0001.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://achyuta0001.github.io/og.png');
  await expect(page).toHaveTitle('Achyuta K Upadya — Full-stack & platform engineer');
});
