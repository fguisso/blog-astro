import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../theme.config';
import { routes } from '../utils/routes';

function resolveSite(context) {
	if (context.site) {
		return new URL(context.site.toString());
	}

	return new URL(themeConfig.site.url);
}

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	const site = resolveSite(context);
	const siteWithBase = new URL(routes.home(), site);
	const stylesheet = routes.rssStylesheet();
	const homeLink = routes.home();
	const absoluteUrl = (path) => new URL(path, site).toString();

	return rss({
		title: themeConfig.site.title,
		description: themeConfig.site.description,
		site: siteWithBase.toString(),
		stylesheet,
		customData: `<language>pt-BR</language><homeLink>${homeLink}</homeLink>`,
		items: posts.map((post) => {
			const updated = post.data.updatedDate ? post.data.updatedDate.toUTCString() : null;
			const link = absoluteUrl(routes.blogPost(post.id));
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
