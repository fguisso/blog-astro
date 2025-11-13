// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { themeConfig } from './src/theme.config';

// https://astro.build/config
export default defineConfig({
	site: themeConfig.site.url,
	integrations: [mdx(), sitemap()],
});

export { themeConfig };
