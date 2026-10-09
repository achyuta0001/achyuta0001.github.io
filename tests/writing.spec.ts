import { test, expect } from './fixtures';

const POST = '/writing/what-a-log-keeps-after-a-crash/';

test('home Writing section links to the post', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('#writing').getByRole('link', { name: 'What a commit log keeps when the machine dies mid-write' });
  await expect(link).toHaveAttribute('href', POST);
  await expect(page.locator('#writing time')).toHaveAttribute('datetime', '2026-10-09');
});

test('writing index lists the post and links home', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page).toHaveTitle('Writing — Achyuta K Upadya');
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();
  await expect(page.getByRole('link', { name: /What a commit log keeps/ })).toHaveAttribute('href', POST);
  await expect(page.getByRole('link', { name: '← Achyuta K Upadya' })).toHaveAttribute('href', '/');
});

test('post renders with heading, byline, code, table and the capture', async ({ page }) => {
  await page.goto(POST);
  await expect(page).toHaveTitle('What a commit log keeps when the machine dies mid-write — Achyuta K Upadya');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What a commit log keeps when the machine dies mid-write');
  await expect(page.locator('.byline time')).toHaveText('9 October 2026');
  await expect(page.getByRole('heading', { level: 2, name: 'One walk fixes both' })).toBeVisible();
  await expect(page.locator('pre.astro-code')).toHaveCount(3);
  await expect(page.locator('.prose table')).toContainText('SyncEachAppend');
  const img = page.getByRole('img', { name: /store file is truncated mid-record/ });
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: '← Writing' })).toHaveAttribute('href', '/writing/');
});

test('post describes itself as a BlogPosting', async ({ page }) => {
  await page.goto(POST);
  const ld = JSON.parse((await page.locator('head script[type="application/ld+json"]').textContent())!);
  expect(ld).toMatchObject({
    '@type': 'BlogPosting',
    headline: 'What a commit log keeps when the machine dies mid-write',
    datePublished: '2026-10-09',
    url: 'https://achyuta0001.github.io/writing/what-a-log-keeps-after-a-crash/',
    author: { name: 'Achyuta K Upadya' },
  });
});

test('code blocks follow the dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(POST);
  const bg = await page.locator('pre.astro-code').first().evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).not.toBe('rgb(255, 255, 255)');
});

test.describe('narrow phone post', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('no horizontal page scroll; wide code scrolls inside its block', async ({ page }) => {
    await page.goto(POST);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
