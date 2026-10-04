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
