// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { themeConfig } from './src/theme.config';

const siteEnv = process.env.SITE_URL;
const baseEnv = process.env.PUBLIC_BASE_PATH ?? process.env.BASE_PATH;
const defaultSite = themeConfig.site?.url ?? 'http://localhost:4321/';
const siteUrl = new URL(siteEnv ?? defaultSite);

function normalizeBase(value, fallback = '/') {
	const raw = value ?? fallback ?? '/';
	if (!raw || raw === '/') {
		return '/';
	}

	const cleaned = raw.replace(/^\/|\/$/g, '');
	return cleaned ? `/${cleaned}` : '/';
}

const inferredBase = siteUrl.pathname || '/';
const normalizedBase = normalizeBase(baseEnv, inferredBase);
const siteOrigin = siteUrl.origin;

// https://astro.build/config
export default defineConfig({
	site: siteOrigin,
	base: normalizedBase,
	integrations: [mdx(), sitemap()],
	i18n: {
		defaultLocale: 'pt',
		locales: ['pt', 'en'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});

export { themeConfig };
