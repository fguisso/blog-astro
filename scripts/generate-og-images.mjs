#!/usr/bin/env node
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import {
	cleanOgOutputFolder,
	loadAvatarDataUrl,
	loadWordmarkDataUrl,
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
		const [fonts, siteMeta, posts, avatarSrc, logoWordmarkSrc] = await Promise.all([
			loadFonts(),
			readSiteMeta(),
			loadPostsFromContentStore(),
			loadAvatarDataUrl(),
			loadWordmarkDataUrl(),
		]);
		if (posts.length === 0) {
			log('No blog posts found. Skipping OG generation.');
			return;
		}
		await ensureOutputDir();
		await cleanOgOutputFolder();
		let successCount = 0;
		const failures = [];
		for (const post of posts) {
			try {
				const png = await renderOgImageBuffer(post, fonts, siteMeta, { avatarSrc, logoWordmarkSrc });
				const localeDir = path.join(ogOutputDir, post.lang ?? 'pt');
				await mkdir(localeDir, { recursive: true });
				const outputPath = path.join(localeDir, `${post.slug}.png`);
				await writeFile(outputPath, png);
				successCount += 1;
				log(`Created ${path.relative(projectRoot, outputPath)}`);
			} catch (error) {
				const message = error instanceof Error ? error.stack || error.message : String(error);
				failures.push({ slug: post.slug, message });
				log(`Failed to render ${post.slug}: ${message}`);
			}
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
