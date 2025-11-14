import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../theme.config';
import { withBase } from '../utils/paths';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	const site = new URL((context.site ?? themeConfig.site.url).toString());
	const siteWithBase = new URL(withBase('/'), site);
	const stylesheet = withBase('/rss.xsl');
	const homeLink = withBase('/');

	return rss({
		title: themeConfig.site.title,
		description: themeConfig.site.description,
		site: siteWithBase.toString(),
		stylesheet,
		customData: `<language>pt-BR</language><homeLink>${homeLink}</homeLink>`,
		items: posts.map((post) => {
			const updated = post.data.updatedDate ? post.data.updatedDate.toUTCString() : null;
			const link = new URL(withBase(`/blog/${post.id}/`), site).toString();
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
