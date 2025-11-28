import { test, expect } from '@playwright/test';

test('home renders hero and latest posts', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/guisso\.dev/i);
	await expect(page.getByRole('heading', { level: 1, name: /Fernando Guisso/i })).toBeVisible();
	await expect(page.getByText(/Security Software Engineer/i)).toBeVisible();

	await expect(page.getByRole('link', { name: /Ver posts/i })).toBeVisible();
	await expect(page.locator('#latest')).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: /novos artigos/i })).toBeVisible();
	await expect(page.locator('#latest-grid li').first()).toBeVisible();

	await expect(page.getByRole('link', { name: /Veja mais/i })).toBeVisible();
});
