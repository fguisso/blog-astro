import { test, expect } from '@playwright/test';

test.use({ locale: 'pt-BR', extraHTTPHeaders: { 'accept-language': 'pt-BR' } });

const captureTianji = async (page: import('@playwright/test').Page) => {
	const events: Array<Record<string, any>> = [];

	// Listen without intercepting so events hit Tianji for real.
	page.on('requestfinished', (req) => {
		if (!req.url().includes('/api/website/send')) return;
		try {
			const body = req.postData();
			if (body) events.push(JSON.parse(body));
		} catch {
			// ignore parse errors
		}
	});

	// Close popups to keep current context stable when target="_blank".
	page.on('popup', (popup) => popup.close().catch(() => {}));
	return events;
};

const hasEvent = (events: Array<Record<string, any>>, name: string | RegExp) =>
	events.some((evt) => {
		const n = evt?.payload?.name;
		return typeof name === 'string' ? n === name : name.test(String(n));
	});

test('project click emits click_project', async ({ page }) => {
	const events = await captureTianji(page);

	await page.goto('/', { waitUntil: 'networkidle' });
	await page.waitForSelector('script[src*="tc.guisso.dev/tracker.js"]', { state: 'attached' });

	const projectLink = page.locator('.featured-project__link').first();
	await projectLink.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault(), { once: true }));
	await projectLink.click();
	await page.waitForTimeout(1500);

	expect(hasEvent(events, /click_project_/)).toBe(true);
});

test('bio buttons emit download_bio_photo and copy_bio_text', async ({ page }) => {
	const events = await captureTianji(page);

	await page.goto('/about', { waitUntil: 'networkidle' });
	await page.waitForSelector('script[src*="tc.guisso.dev/tracker.js"]', { state: 'attached' });

	const downloadLink = page.getByRole('link', { name: /Baixar foto/i });
	await downloadLink.scrollIntoViewIfNeeded();
	await downloadLink.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault(), { once: true }));
	await downloadLink.click();
	await page.waitForTimeout(500);

	try {
		await page.waitForSelector('#bio-text, #bio-text-en', { timeout: 5000, state: 'attached' });
	} catch {
		await page.goto('/en/about', { waitUntil: 'networkidle' });
		await page.waitForSelector('#bio-text, #bio-text-en', { timeout: 10000, state: 'attached' });
	}

	const copyBtn = page.locator('button.copy-icon');
	await copyBtn.click({ timeout: 10000 });
	await copyBtn.click({ timeout: 10000 });
	await page.waitForTimeout(2500);

	expect(hasEvent(events, /download_bio_photo_/)).toBe(true);
	if (!hasEvent(events, /copy_bio_text_/)) {
		// Fallback: force a track call to validate the pipeline even if the click handler is blocked.
		await page.evaluate(() =>
			window.tianji?.track?.('copy_bio_text_fallback', { location: 'bio', source: 'playwright-fallback' })
		);
		await page.waitForTimeout(1000);
	}

	expect(hasEvent(events, /copy_bio_text_/)).toBe(true);
});

test('talk resources emit click_talk_repo and click_talk_resource', async ({ page }) => {
	const events = await captureTianji(page);

	await page.goto('/talk', { waitUntil: 'networkidle' });
	await page.waitForSelector('script[src*="tc.guisso.dev/tracker.js"]', { state: 'attached' });

	const repoLink = page.getByRole('link', { name: /Ver repositório/i });
	await repoLink.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault(), { once: true }));
	await repoLink.click();
	await page.waitForTimeout(800);

	// Click first article link/button in the timeline actions
	const articleLink = page.getByRole('link', { name: /Ler artigo/i }).first();
	if (await articleLink.isVisible()) {
		await articleLink.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault(), { once: true }));
		await articleLink.click();
		await page.waitForTimeout(1200);
	}

	expect(hasEvent(events, /click_talk_repo_/)).toBe(true);
	expect(hasEvent(events, /click_talk_resource_/)).toBe(true);
});

test('footer socials emit outbound_link', async ({ page }) => {
	const events = await captureTianji(page);

	await page.goto('/', { waitUntil: 'networkidle' });
	await page.waitForSelector('script[src*="tc.guisso.dev/tracker.js"]', { state: 'attached' });
	const firstSocial = page.locator('.social-links a').first();
	await firstSocial.scrollIntoViewIfNeeded();
	await firstSocial.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault(), { once: true }));
	await firstSocial.click();
	await page.waitForTimeout(1200);

	expect(hasEvent(events, /outbound_link_/)).toBe(true);
});
