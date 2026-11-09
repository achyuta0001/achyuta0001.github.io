import { test, expect } from './fixtures';

test('first load: a cursor swarm builds wireframe boxes over the hero, then removes itself', async ({ page }) => {
  await page.goto('/');
  const boot = page.locator('.fx-boot');
  await expect(boot).toHaveCount(1);
  await expect(boot).toHaveAttribute('aria-hidden', 'true');
  expect(await boot.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none');
  expect(await boot.locator('.fx-bot').count()).toBeGreaterThanOrEqual(20);
  await expect(boot.locator('.fx-box.done .fx-tag').filter({ hasText: /^h1 · name {2}\d+×\d+$/ })).toHaveCount(1);
  expect(await boot.locator('.fx-box').count()).toBeGreaterThan(4);
  await expect(boot).toHaveCount(0, { timeout: 6_000 });
  await page.reload();
  await page.waitForTimeout(300);
  await expect(page.locator('.fx-boot')).toHaveCount(0);
});

test('input ends the intro at once, and links under it still work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.fx-boot')).toHaveCount(1);
  await page.getByRole('link', { name: 'See the work' }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator('.fx-boot')).toHaveCount(0, { timeout: 1_000 });
});

test('a deep link skips the blueprint pass', async ({ page }) => {
  await page.goto('/#contact');
  await page.waitForTimeout(300);
  await expect(page.locator('.fx-boot')).toHaveCount(0);
});

test('section headings get a selection callout as they scroll in', async ({ page }) => {
  await page.goto('/');
  const h = page.locator('#stack h2');
  await h.scrollIntoViewIfNeeded();
  const anno = h.locator('.fx-anno');
  await expect(anno).toHaveCount(1);
  await expect(anno).toHaveAttribute('aria-hidden', 'true');
  await expect(h).toHaveAccessibleName('Stack');
  await expect(anno).toHaveCount(0, { timeout: 5_000 });
});

test.describe('narrow screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('a smaller swarm on phones', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.fx-bot')).toHaveCount(14);
    await expect(page.locator('.fx-boot')).toHaveCount(0, { timeout: 6_000 });
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no annotation layer at all', async ({ page }) => {
    await page.goto('/');
    await page.locator('#stack h2').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator('.fx-layer')).toHaveCount(0);
  });
});
