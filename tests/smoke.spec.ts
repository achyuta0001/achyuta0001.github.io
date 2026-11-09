import { test, expect } from './fixtures';

test('home renders the name as the only h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Achyuta K Upadya');
});

test('dark only: head declares one scheme, canonical and OG; no theme toggle', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://achyuta0001.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://achyuta0001.github.io/og.png');
  await expect(page).toHaveTitle('Achyuta K Upadya — Full-stack & platform engineer');
  await expect(page.locator('[data-theme-toggle]')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});

test('section index lines number the sections and stay out of the accessibility tree', async ({ page }) => {
  await page.goto('/');
  const idx = page.locator('main .sec-index');
  await expect(idx).toHaveCount(6);
  await expect(idx.first()).toHaveAttribute('aria-hidden', 'true');
  await expect(idx.first()).toContainText('01 work');
  await expect(idx.last()).toContainText('[06/06]');
});

