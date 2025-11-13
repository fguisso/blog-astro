import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../theme.config';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	const site = context.site ?? themeConfig.site.url;

	return rss({
		title: themeConfig.site.title,
		description: themeConfig.site.description,
		site,
		stylesheet: '/rss.xsl',
		customData: '<language>pt-BR</language>',
		items: posts.map((post) => {
			const updated = post.data.updatedDate ? post.data.updatedDate.toUTCString() : null;
			return {
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.pubDate,
				categories: post.data.tags ?? [],
				link: `/blog/${post.id}/`,
				customData: updated ? `<updated>${updated}</updated>` : undefined,
			};
		}),
	});
}
