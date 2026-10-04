import { test as base, expect } from '@playwright/test';
import { test } from './fixtures';
import { readFileSync } from 'node:fs';

for (const path of ['/favicon.svg', '/apple-touch-icon.png', '/og.png', '/robots.txt', '/resume.pdf']) {
  test(`${path} is served`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  });
}

test('og.png is 1200x630', async ({ page }) => {
  await page.goto('/og.png');
  const size = await page.evaluate(() => {
    const img = document.querySelector('img')!;
    return [img.naturalWidth, img.naturalHeight];
  });
  expect(size).toEqual([1200, 630]);
});

test('resume PDF does not contain the phone number', () => {
  const pdf = readFileSync('dist/resume.pdf').toString('latin1');
  expect(pdf).not.toContain('[redacted]');
});

base('unknown path serves 404 page linking home', async ({ page }) => {
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
});
