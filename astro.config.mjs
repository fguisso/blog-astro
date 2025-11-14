// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { themeConfig } from './src/theme.config';

const rawSite = process.env.SITE_URL ?? themeConfig.site.url;
const siteUrl = new URL(rawSite);
const baseEnv = process.env.PUBLIC_BASE_PATH ?? process.env.BASE_PATH;

function normalizeBase(value, fallback) {
	const raw = value ?? fallback;
	if (!raw || raw === '/') {
		return '/';
	}

	const cleaned = raw.replace(/^\/|\/$/g, '');
	return cleaned ? `/${cleaned}` : '/';
}

const inferredBase = siteUrl.pathname === '/' ? '/' : siteUrl.pathname;
const normalizedBase = normalizeBase(baseEnv, inferredBase);
const siteOrigin = siteUrl.origin;

// https://astro.build/config
export default defineConfig({
	site: siteOrigin,
	base: normalizedBase,
	integrations: [mdx(), sitemap()],
});

export { themeConfig };
