import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../../theme.config';
import { groupPostsByTag } from '../../utils/tags';

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	const groups = groupPostsByTag(posts);

	return Array.from(groups.entries()).map(([slug, group]) => ({
		params: { tag: slug },
		props: {
			tagLabel: group.label,
			posts: group.posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()),
		},
	}));
}

export async function GET(context) {
	const { tagLabel, posts } = context.props;
	const site = context.site ?? themeConfig.site.url;

	return rss({
		title: `Guisso.dev - ${tagLabel}`,
		description: `O endereço desta página também é um RSS feed. Use no seu leitor favorito para seguir apenas meus posts sobre ${tagLabel}.`,
		site,
		stylesheet: '/tag-feed.xsl',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags ?? [],
			link: `/blog/${post.id}/`,
		})),
	});
}
