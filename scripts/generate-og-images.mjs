#!/usr/bin/env node
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import {
	cleanOgOutputFolder,
	loadAvatarDataUrl,
	loadFonts,
	loadPostsFromContentStore,
	log,
	ogOutputDir,
	projectRoot,
	readSiteMeta,
	renderOgImageBuffer,
	runAstroSync,
} from './og-shared.mjs';

async function ensureOutputDir() {
	await mkdir(ogOutputDir, { recursive: true });
}

async function main() {
	try {
		await runAstroSync();
		const [fonts, siteMeta, posts, avatarSrc] = await Promise.all([
			loadFonts(),
			readSiteMeta(),
			loadPostsFromContentStore(),
			loadAvatarDataUrl(),
		]);
		if (posts.length === 0) {
			log('No blog posts found. Skipping OG generation.');
			return;
		}
		const pendingPosts = posts.filter((post) => !post.ogImage);
		const skipped = posts.length - pendingPosts.length;
		await ensureOutputDir();
		if (pendingPosts.length === 0) {
			log(
				skipped > 0
					? 'All posts define custom ogImage. Nothing to render.'
					: 'No posts found that require OG generation.',
			);
			return;
		}
		await cleanOgOutputFolder(pendingPosts.map((post) => post.slug));
		let successCount = 0;
		const failures = [];
		for (const post of pendingPosts) {
			try {
				const png = await renderOgImageBuffer(post, fonts, siteMeta, { avatarSrc });
				const outputPath = path.join(ogOutputDir, `${post.slug}.png`);
				await writeFile(outputPath, png);
				successCount += 1;
				log(`Created ${path.relative(projectRoot, outputPath)}`);
			} catch (error) {
				const message = error instanceof Error ? error.stack || error.message : String(error);
				failures.push({ slug: post.slug, message });
				log(`Failed to render ${post.slug}: ${message}`);
			}
		}
		if (skipped > 0) {
			log(`Skipped ${skipped} post(s) with custom ogImage entries.`);
		}
		if (failures.length > 0) {
			log(
				`Rendered ${successCount} image(s) with ${failures.length} failure(s). Check logs for details.`,
			);
			process.exitCode = 1;
			return;
		}
		log(`Generated ${successCount} Open Graph image(s).`);
	} catch (error) {
		console.error(`[og-generator] ${error.stack || error.message}`);
		process.exitCode = 1;
	}
}

await main();
