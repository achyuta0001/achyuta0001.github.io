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
  await expect(page.locator('.fx-cursor')).toHaveCount(5);
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

test('cursors move between resting spots on wide screens with a fine pointer', async ({ page }) => {
  await page.goto('/#work');
  const cursors = page.locator('.fx-cursor');
  await expect(cursors).toHaveCount(5);
  await expect(page.locator('.fx-cursor[data-state="rest"]').first()).toBeAttached({ timeout: 6_000 });
});

test('cursors are pinned to the page, so they scroll with what they point at', async ({ page }) => {
  await page.goto('/#work');
  const rest = page.locator('.fx-cursor[data-state="rest"]').first();
  await expect(rest).toBeAttached({ timeout: 6_000 });
  const moved = await rest.evaluate(async (el) => {
    const before = el.getBoundingClientRect().top;
    scrollBy(0, 150);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return before - el.getBoundingClientRect().top;
  });
  expect(Math.abs(moved - 150)).toBeLessThan(2);
});

test('resting cursors never sit on top of text', async ({ page }) => {
  await page.goto('/#work');
  await expect.poll(() => page.locator('.fx-cursor[data-state="rest"]').count(), { timeout: 8_000 }).toBeGreaterThanOrEqual(3);
  const overlaps = await page.evaluate(() => {
    const sel = 'main p, main li, main h2, main h3, main h4, main a, main img, main dd, main dt, .hero p, .hero h1, .hero a, .hero pre, .hero dd, .hero dt, .topbar';
    const text = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0);
    const bad: string[] = [];
    for (const c of document.querySelectorAll<HTMLElement>('.fx-cursor[data-state="rest"]')) {
      const f = c.getBoundingClientRect();
      if (text.some((t) => f.left < t.right && f.right > t.left && f.top < t.bottom && f.bottom > t.top)) bad.push(c.textContent || 'unnamed');
    }
    return bad;
  });
  expect(overlaps).toEqual([]);
});

test('named cursors take the names of the section they rest in', async ({ page }) => {
  await page.goto('/#experience');
  const named = page.locator('.fx-cursor[data-state="rest"][data-region="experience"] span');
  await expect.poll(() => named.count(), { timeout: 8_000 }).toBeGreaterThan(0);
  for (const t of await named.allTextContents()) expect(['helm upgrade', 'jenkins', 'vault']).toContain(t);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  const contact = page.locator('.fx-cursor[data-region="contact"] span');
  await expect.poll(() => contact.count(), { timeout: 8_000 }).toBeGreaterThan(0);
  for (const t of await contact.allTextContents()) expect(['recruiter', 'hiring manager', 'say hi']).toContain(t);
});

test.describe('narrow screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('a smaller swarm, and no drifting cursors afterwards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.fx-bot')).toHaveCount(14);
    await expect(page.locator('.fx-boot')).toHaveCount(0, { timeout: 6_000 });
    await expect(page.locator('.fx-cursor')).toHaveCount(0);
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
