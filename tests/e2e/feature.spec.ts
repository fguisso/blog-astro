import { test, expect } from '@playwright/test';

test('user can jump to latest posts and open the archive', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('link', { name: /Ver posts/i }).click();
	await expect(page).toHaveURL(/#latest/);
	await expect(page.locator('#latest-grid li').first()).toBeVisible();

	await page.getByRole('link', { name: /Veja mais/i }).click();
	await expect(page).toHaveURL(/\/blog/);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const firstPost = page.locator('.featured-projects__grid--posts li a').first();
	await expect(firstPost).toBeVisible();
});
