import { test, expect } from '@playwright/test';

test('renders mocked profile data from API route', async ({ page }) => {
	await page.route('**/api/profile', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ name: 'Test User', role: 'Security Engineer' }),
		}),
	);

	await page.goto('/');

	await page.evaluate(async () => {
		const res = await fetch('/api/profile');
		const data = await res.json();
		const container = document.createElement('div');
		container.id = 'mock-profile';
		container.textContent = `${data.name} — ${data.role}`;
		document.body.appendChild(container);
	});

	await expect(page.getByText('Test User — Security Engineer')).toBeVisible();
});
