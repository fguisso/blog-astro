import type { CollectionEntry } from 'astro:content';

export type TagGroup = {
	label: string;
	posts: CollectionEntry<'blog'>[];
};

export function slugifyTag(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function groupPostsByTag(posts: CollectionEntry<'blog'>[]) {
	const tagMap = new Map<string, TagGroup>();

	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			const slug = slugifyTag(tag);
			const group = tagMap.get(slug);

			if (group) {
				group.posts.push(post);
			} else {
				tagMap.set(slug, { label: tag, posts: [post] });
			}
		}
	}

	return tagMap;
}
