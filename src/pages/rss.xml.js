import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../theme.config';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: themeConfig.site.title,
		description: themeConfig.site.description,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
		})),
	});
}
