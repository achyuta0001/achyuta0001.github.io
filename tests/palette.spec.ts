import { test, expect } from './fixtures';

const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Command palette' });

test('Control+K opens, Esc closes', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('combobox')).toBeFocused();
  await expect(page.getByRole('option', { name: 'Copy email' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
});

test('trigger click opens and focus returns to trigger on close', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  const trigger = page.getByRole('button', { name: 'Open command palette' });
  await trigger.click();
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('shortcut pressed before hydration is honoured', async ({ page }) => {
  await page.route('**/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Control+k');
  await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
});

test('navigate command scrolls to section and updates hash', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('combobox')).toBeFocused();
  await page.keyboard.type('Contact');
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
});

test('selected item has a visible non-colour-only indicator', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  const sel = page.locator('[cmdk-item][data-selected="true"]');
  await expect(sel).toBeVisible();
  const s = await sel.evaluate((e) => {
    const c = getComputedStyle(e);
    return { shadow: c.boxShadow, outline: c.outlineStyle };
  });
  expect(s.shadow !== 'none' || s.outline !== 'none').toBe(true);
});

test('copy email announces success', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('achyuta0001@gmail.com');
});

test('copy email failure shows the address', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toHaveText('Couldn’t copy — achyuta0001@gmail.com');
});

test('toggle theme command cycles theme', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__paletteReady === true);
  await page.keyboard.press('Control+k');
  await page.getByRole('option', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('trigger label is platform-appropriate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-kbd]')).toHaveText(/^(⌘K|Ctrl K|Menu)$/);
});
