import { test, expect } from './fixtures';

test('tabs: first selected, click switches, arrows/home/end move', async ({ page }) => {
  await page.goto('/#stack');
  const list = page.getByRole('tablist', { name: 'Stack groups' });
  const tabs = list.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  const stack = page.locator('#stack');
  await expect(page.getByRole('tabpanel', { name: 'Languages' })).toBeVisible();
  await expect(stack.getByText('Kubernetes', { exact: true })).toBeHidden();

  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(stack.getByText('Kubernetes', { exact: true })).toBeVisible();
  await expect(stack.getByText('Spring Boot', { exact: true })).toBeHidden();

  await tabs.nth(3).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(4)).toBeFocused();
  await expect(tabs.nth(4)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(4)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
});

test('tab switch does not change section height', async ({ page }) => {
  await page.goto('/#stack');
  const sec = page.locator('#stack');
  const h0 = (await sec.boundingBox())!.height;
  await page.getByRole('tab', { name: 'Frontend' }).click();
  const h1 = (await sec.boundingBox())!.height;
  expect(Math.abs(h1 - h0)).toBeLessThan(1);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all groups render stacked with headings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    for (const name of ['Languages', 'Backend', 'Frontend', 'Infra', 'Data']) {
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    await expect(page.locator('#stack').getByText('Kubernetes', { exact: true })).toBeVisible();
  });
});

test.describe('narrow phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('tabs stay on one row and the indicator sits under the selected tab', async ({ page }) => {
    await page.goto('/#stack');
    const tabs = page.getByRole('tablist', { name: 'Stack groups' }).getByRole('tab');
    const tops = await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

    for (const i of [4, 0]) {
      await tabs.nth(i).click();
      await expect(async () => {
        const tab = await tabs.nth(i).boundingBox();
        const bar = await page.locator('.tab-indicator').boundingBox();
        expect(tab && bar).toBeTruthy();
        expect(Math.abs(bar!.x - tab!.x)).toBeLessThan(1);
        expect(Math.abs(bar!.width - tab!.width)).toBeLessThan(1);
        expect(Math.abs(bar!.y + bar!.height - (tab!.y + tab!.height))).toBeLessThan(2);
        expect(tab!.x).toBeGreaterThanOrEqual(0);
        expect(tab!.x + tab!.width).toBeLessThanOrEqual(360);
      }).toPass();
    }
  });
});
