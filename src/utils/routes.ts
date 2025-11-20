import { DEFAULT_LOCALE, prefixForLocale, type LocaleCode } from '../i18n/config';
import { withBase } from './paths';

function normalizePath(path: string) {
	return path.startsWith('/') ? path : `/${path}`;
}

function localizePath(path: string, locale: LocaleCode) {
	const [rawPath, rawQuery] = path.split('?');
	const normalized = normalizePath(rawPath);
	const prefix = prefixForLocale(locale);

	let localizedPath: string;
	if (!prefix) {
		localizedPath = normalized;
	} else if (normalized === '/') {
		localizedPath = `${prefix}/`;
	} else {
		localizedPath = `${prefix}${normalized}`;
	}

	const query = rawQuery ? `?${rawQuery}` : '';
	return withBase(`${localizedPath}${query}`);
}

export const routes = {
	home: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/', locale),
	blog: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/blog', locale),
	tags: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/tags', locale),
	projects: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/projects', locale),
	styleGuide: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/style-guide', locale),
	talks: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/talk', locale),
	about: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/about', locale),
	rss: (locale: LocaleCode = DEFAULT_LOCALE) => localizePath('/rss.xml', locale),
	sitemap: () => withBase('/sitemap-index.xml'),
	rssStylesheet: () => withBase('/rss.xsl'),
	tagFeedStylesheet: () => withBase('/tag-feed.xsl'),
	tagFeed: (slug: string, locale: LocaleCode = DEFAULT_LOCALE) =>
		localizePath(`/tags/${slug}.xml`, locale),
	blogPost: (slug: string, locale: LocaleCode = DEFAULT_LOCALE) =>
		localizePath(`/blog/${slug}/`, locale),
	blogTagFilter: (tag: string, locale: LocaleCode = DEFAULT_LOCALE) =>
		localizePath(`/blog?tag=${encodeURIComponent(tag)}`, locale),
};

export type RouteKey = keyof typeof routes;
