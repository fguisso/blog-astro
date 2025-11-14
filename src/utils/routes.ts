import { withBase } from './paths';

export const routes = {
	home: () => withBase('/'),
	blog: () => withBase('/blog'),
	tags: () => withBase('/tags'),
	projects: () => withBase('/projects'),
	styleGuide: () => withBase('/style-guide'),
	talks: () => withBase('/talk'),
	about: () => withBase('/about'),
	rss: () => withBase('/rss.xml'),
	sitemap: () => withBase('/sitemap-index.xml'),
	rssStylesheet: () => withBase('/rss.xsl'),
	tagFeedStylesheet: () => withBase('/tag-feed.xsl'),
	tagFeed: (slug: string) => withBase(`/tags/${slug}.xml`),
	blogPost: (slug: string) => withBase(`/blog/${slug}/`),
	blogTagFilter: (tag: string) => withBase(`/blog?tag=${encodeURIComponent(tag)}`),
};

export type RouteKey = keyof typeof routes;
