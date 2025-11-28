import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const useWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';

export default defineConfig({
	testDir: 'tests/e2e',
	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: [['list']],
	use: {
		baseURL,
		headless: true,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'off',
	},
	webServer: useWebServer
		? {
				command: process.env.PLAYWRIGHT_PREVIEW_COMMAND ?? `npm run preview -- --host --port ${PORT}`,
				url: baseURL,
				timeout: 120_000,
				reuseExistingServer: !process.env.CI,
				stdout: 'pipe',
				stderr: 'pipe',
			}
		: undefined,
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
