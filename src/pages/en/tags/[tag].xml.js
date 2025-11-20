import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { themeConfig } from '../../../theme.config';
import { groupPostsByTag } from '../../../utils/tags';
import { routes } from '../../../utils/routes';

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
	const locale = 'en';
	const { tagLabel, posts } = context.props;
	const site = resolveSite(context);
	const siteWithBase = new URL(routes.home(locale), site);
	const stylesheet = routes.tagFeedStylesheet();
	const homeLink = routes.home(locale);
	const absoluteUrl = (path) => new URL(path, site).toString();
	const filteredPosts = posts.filter((post) => post.data.lang === locale);

	return rss({
		title: `${themeConfig.site.title} - ${tagLabel}`,
		description: `This page is also an RSS feed. Subscribe to follow only the posts tagged ${tagLabel}.`,
		site: siteWithBase.toString(),
		stylesheet,
		customData: `<homeLink>${homeLink}</homeLink>`,
		items: filteredPosts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			categories: post.data.tags ?? [],
			link: absoluteUrl(routes.blogPost(post.data.canonicalSlug ?? post.slug, locale)),
		})),
	});
}
