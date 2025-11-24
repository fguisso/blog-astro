import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { DEFAULT_LOCALE, getHtmlLang } from '../i18n/config';
import { getSiteMeta, themeConfig } from '../theme.config';
import { routes } from '../utils/routes';

function resolveSite(context) {
	if (context.site) {
		return new URL(context.site.toString());
	}

	return new URL(themeConfig.site.url);
}

export async function buildRssResponse(context, locale = DEFAULT_LOCALE) {
	const posts = (await getCollection('blog'))
		.filter((post) => post.data.lang === locale)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const site = resolveSite(context);
	const siteWithBase = new URL(routes.home(locale), site);
	const stylesheet = routes.rssStylesheet();
	const homeLink = routes.home(locale);
	const absoluteUrl = (path) => new URL(path, site).toString();
	const feedLanguage = getHtmlLang(locale);
	const siteMeta = getSiteMeta(locale);

	return rss({
		title: siteMeta.title,
		description: siteMeta.description,
		site: siteWithBase.toString(),
		stylesheet,
		customData: `<language>${feedLanguage}</language><homeLink>${homeLink}</homeLink>`,
		items: posts.map((post) => {
			const updated = post.data.updatedDate ? post.data.updatedDate.toUTCString() : null;
			const link = absoluteUrl(routes.blogPost(post.data.canonicalSlug ?? post.slug, locale));
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate,
				categories: post.data.tags ?? [],
				link,
				customData: updated ? `<updated>${updated}</updated>` : undefined,
			};
		}),
	});
}

export async function GET(context) {
	const locale = context.currentLocale ?? DEFAULT_LOCALE;
	return buildRssResponse(context, locale);
}
