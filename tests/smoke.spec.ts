import { test, expect } from './fixtures';

test('home renders the name as the only h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Achyuta K Upadya');
});
