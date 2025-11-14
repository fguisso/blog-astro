import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../../theme.config';
import { groupPostsByTag } from '../../utils/tags';
import { routes } from '../../utils/routes';

function resolveSite(context) {
	if (context.site) {
		return new URL(context.site.toString());
	}

	return new URL(themeConfig.site.url);
}

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
	const site = resolveSite(context);
	const siteWithBase = new URL(routes.home(), site);
	const stylesheet = routes.tagFeedStylesheet();
	const homeLink = routes.home();
	const absoluteUrl = (path) => new URL(path, site).toString();

	return rss({
		title: `${themeConfig.site.title} - ${tagLabel}`,
		description: `O endereço desta página também é um RSS feed. Use no seu leitor favorito para seguir apenas meus posts sobre ${tagLabel}.`,
		site: siteWithBase.toString(),
		stylesheet,
		customData: `<homeLink>${homeLink}</homeLink>`,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags ?? [],
			link: absoluteUrl(routes.blogPost(post.id)),
		})),
	});
}
