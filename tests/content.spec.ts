import { test, expect } from './fixtures';

test('all sections render with headings in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['work', 'experience', 'stack', 'writing', 'about', 'contact']);
  for (const name of ['Selected work', 'Experience', 'Stack', 'Writing', 'About', 'Let’s work together']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
});

test('hero shows role, location and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Full-stack & platform engineer in Bengaluru.')).toBeVisible();
  await expect(page.getByText(/unglamorous half of shipping/)).toBeVisible();
});

test('work list has six numbered projects with Goo first and releases link', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#work li.work-row');
  await expect(rows).toHaveCount(6);
  await expect(rows.first().locator('.num')).toHaveText('01');
  await expect(rows.first().getByRole('link', { name: 'Goo' })).toHaveAttribute('href', 'https://github.com/achyuta0001/Goo');
  await expect(rows.first().getByRole('link', { name: /Releases/ })).toHaveAttribute('href', 'https://github.com/achyuta0001/goo-releases/releases');
  await expect(rows.nth(5).locator('.num')).toHaveText('06');
});

test('experience shows both HSBC roles', async ({ page }) => {
  await page.goto('/');
  const exp = page.locator('#experience');
  await expect(exp.getByText('Unified Case Management')).toBeVisible();
  await expect(exp.getByText('goAML Compliance Platform')).toBeVisible();
  await expect(exp.getByText(/three platform-wide migrations/)).toBeVisible();
});

test('contact links and photography link are correct', async ({ page }) => {
  await page.goto('/');
  const c = page.locator('#contact');
  await expect(c.getByRole('link', { name: 'achyuta0001@gmail.com' })).toHaveAttribute('href', 'mailto:achyuta0001@gmail.com');
  await expect(c.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/achyuta0001');
  await expect(c.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/in/achyuta-k-upadya');
  await expect(c.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/resume.pdf');
  await expect(page.locator('#about a')).toHaveAttribute('href', 'https://achyuta0001.github.io/photography-portfolio/');
});

test('about tells the side-project story in three paragraphs', async ({ page }) => {
  await page.goto('/');
  const paras = page.locator('#about p');
  await expect(paras).toHaveCount(3);
  await expect(paras.nth(1)).toContainText('ashlar started as a question');
  await expect(paras.nth(2).getByRole('link')).toHaveText('Away from the keyboard I shoot product photography.');
});

test('phone number never appears', async ({ page }) => {
  await page.goto('/');
  expect(await page.content()).not.toMatch(/\+91|\b\d{10}\b|\b\d{5}\s\d{5}\b/);
});

test('landmarks and skip link exist', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main#main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every section is visible', async ({ page }) => {
    await page.goto('/');
    for (const id of ['work', 'experience', 'stack', 'writing', 'about', 'contact']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id}`)).toBeVisible();
      expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
    await expect(page.locator('[data-palette-trigger]')).toBeHidden();
  });
});

test('home page describes the owner as a schema.org Person', async ({ page }) => {
  await page.goto('/');
  const ld = JSON.parse(await page.locator('head script[type="application/ld+json"]').textContent() ?? '');
  expect(ld).toMatchObject({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Achyuta K Upadya',
    url: 'https://achyuta0001.github.io/',
    jobTitle: 'Full-stack & platform engineer',
    address: { addressLocality: 'Bengaluru', addressCountry: 'IN' },
    worksFor: { name: 'HSBC Software Development' },
  });
  expect(ld.sameAs).toEqual([
    'https://github.com/achyuta0001',
    'https://linkedin.com/in/achyuta-k-upadya',
    'https://achyuta0001.github.io/photography-portfolio/',
  ]);
});

test('tripwyre and ashlar show real terminal captures; other projects stay text-only', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#work li.work-row');
  for (const [i, alt, loading] of [
    [1, /ashlar log.*simulate a crash/, 'eager'],
    [2, /tripwyre scan on a sample project/, 'lazy'],
  ] as const) {
    const img = rows.nth(i).getByRole('img', { name: alt });
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute('loading', loading);
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
    await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth)).toBeGreaterThan(0);
    const box = (await img.boundingBox())!;
    const row = (await rows.nth(i).locator('.work-body').boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(row.width + 0.5);
  }
  for (const i of [0, 3, 4, 5]) await expect(rows.nth(i).locator('img')).toHaveCount(0);
});

test.describe('narrow phone work images', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('captures fit the column without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    await page.locator('#work img').first().scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

test('project activity, when GitHub was reachable at build, is a dated "updated" line', async ({ page }) => {
  await page.goto('/');
  const lines = page.locator('#work .activity');
  for (const line of await lines.all()) {
    const time = line.locator('time');
    await expect(time).toHaveText(/^updated \d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( \d{4})?$/);
    const iso = await time.getAttribute('datetime');
    expect(Number.isNaN(Date.parse(iso!))).toBe(false);
  }
  expect(await lines.count()).toBeLessThanOrEqual(6);
});
