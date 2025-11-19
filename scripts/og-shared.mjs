#!/usr/bin/env node
import { readFile, readdir, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, '..');
export const ogOutputDir = path.join(projectRoot, 'public', 'og');
const themeConfigPath = path.join(projectRoot, 'src', 'theme.config.ts');
const FONTS_DIR = path.join(projectRoot, 'src', 'assets', 'fonts');
const SPACE_GROTESK_PATH = path.join(FONTS_DIR, 'SpaceGrotesk-Bold.ttf');
const AVATAR_PATH = path.join(projectRoot, 'src', 'assets', 'guisso-avatar.jpg');
const WORDMARK_PATH = path.join(projectRoot, 'public', 'logo-wordmark.png');
const BLOG_CONTENT_DIR = path.join(projectRoot, 'src', 'content', 'blog');
const CONTENT_FILE_EXTENSIONS = new Set(['.md', '.mdx']);
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const RENDER_SCALE = 2;

export function log(message) {
	console.log(`[og-generator] ${message}`);
}

export async function runAstroSync() {
	log('Syncing Astro content collections…');
	await new Promise((resolve, reject) => {
		const astroBin = path.join(projectRoot, 'node_modules', 'astro', 'astro.js');
		const child = spawn('node', [astroBin, 'sync'], {
			cwd: projectRoot,
			stdio: 'inherit',
		});

		child.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`astro sync exited with code ${code}`));
				return;
			}
			resolve();
		});
		child.on('error', reject);
	});
}

export async function readSiteMeta() {
	const fallback = { title: 'Astro Blog', description: 'Blog post', url: '' };
	try {
		const raw = await readFile(themeConfigPath, 'utf-8');
		const siteBlockMatch = raw.match(/site:\s*\{([\s\S]*?)\},/);
		if (!siteBlockMatch) {
			return fallback;
		}
		const siteBlock = siteBlockMatch[1];
		const grab = (key) => siteBlock.match(new RegExp(`${key}:\\s*'([^']+)'`))?.[1];
		return {
			title: grab('title') ?? fallback.title,
			description: grab('description') ?? fallback.description,
			url: grab('url') ?? fallback.url,
		};
	} catch (error) {
		log(`Failed to parse theme config, using fallback metadata. ${error.message}`);
		return fallback;
	}
}

export async function loadFonts() {
	const ofertaPath = path.join(FONTS_DIR, 'Oferta-do-Dia.ttf');
	const interPath = path.join(FONTS_DIR, 'Inter-Regular.ttf');
	const [spaceGrotesk, oferta, inter] = await Promise.all([
		readFile(SPACE_GROTESK_PATH),
		readFile(ofertaPath),
		readFile(interPath),
	]);
	return [
		{ name: 'Space Grotesk', data: spaceGrotesk, weight: 700, style: 'normal' },
		{ name: 'Oferta do Dia', data: oferta, weight: 400, style: 'normal' },
		{ name: 'Inter', data: inter, weight: 400, style: 'normal' },
	];
}

export async function loadPostsFromContentStore() {
	const files = await collectContentEntryFiles(BLOG_CONTENT_DIR);
	if (files.length === 0) {
		return [];
	}
	const posts = [];
	for (const filePath of files) {
		const raw = await readFile(filePath, 'utf-8');
		const frontmatter = extractFrontmatter(raw);
		const slug = path
			.relative(BLOG_CONTENT_DIR, filePath)
			.replace(/\\/g, '/')
			.replace(/\.(md|mdx)$/i, '');
		posts.push({
			slug,
			title:
				typeof frontmatter.title === 'string' && frontmatter.title.trim().length > 0
					? frontmatter.title.trim()
					: slug,
			description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
			tags: normalizeTagList(frontmatter.tags),
		});
	}
	return posts;
}

async function collectContentEntryFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectContentEntryFiles(entryPath)));
		} else if (entry.isFile() && CONTENT_FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
			files.push(entryPath);
		}
	}
	return files.sort((a, b) => a.localeCompare(b));
}

function extractFrontmatter(raw) {
	if (typeof raw !== 'string' || !raw.startsWith('---')) {
		return {};
	}
	const match = raw.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/);
	if (!match) {
		return {};
	}
	return parseFrontmatterBlock(match[1]);
}

function parseFrontmatterBlock(block) {
	const data = {};
	const lines = block.split(/\r?\n/);
	let currentKey = null;
	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		if (line.trim().length === 0) {
			continue;
		}
		const arrayMatch = line.trim().match(/^-\s+(.*)$/);
		if (arrayMatch && currentKey && Array.isArray(data[currentKey])) {
			const value = parseScalarValue(arrayMatch[1]);
			if (value) {
				data[currentKey].push(value);
			}
			continue;
		}
		const normalized = line.trim();
		const keyMatch = normalized.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
		if (!keyMatch) {
			continue;
		}
		const [, key, rest] = keyMatch;
		if (!rest || rest.length === 0) {
			data[key] = [];
			currentKey = key;
		} else {
			const value = parseFrontmatterValue(rest);
			data[key] = value;
			currentKey = key;
		}
	}
	return data;
}

function parseFrontmatterValue(value) {
	const trimmed = value.trim();
	if (!trimmed) {
		return '';
	}
	if (trimmed === '[]') {
		return [];
	}
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		const inner = trimmed.slice(1, -1).trim();
		if (!inner) {
			return [];
		}
		return inner
			.split(',')
			.map((segment) => parseScalarValue(segment))
			.filter((segment) => segment.length > 0);
	}
	return parseScalarValue(trimmed);
}

function parseScalarValue(value) {
	const trimmed = value.trim();
	if (!trimmed) {
		return '';
	}
	const hasMatchingQuotes =
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"));
	return hasMatchingQuotes ? trimmed.slice(1, -1) : trimmed;
}

function normalizeTagList(value) {
	if (Array.isArray(value)) {
		return value
			.map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
			.filter((entry) => entry.length > 0);
	}
	if (typeof value === 'string' && value.trim().length > 0) {
		return [value.trim()];
	}
	return [];
}

export async function loadAvatarDataUrl() {
	try {
		const buffer = await readFile(AVATAR_PATH);
		const ext = path.extname(AVATAR_PATH).slice(1).toLowerCase() || 'jpeg';
		const mime = ext === 'jpg' ? 'jpeg' : ext;
		return `data:image/${mime};base64,${buffer.toString('base64')}`;
	} catch {
		return null;
	}
}

export async function loadWordmarkDataUrl() {
	try {
		const buffer = await readFile(WORDMARK_PATH);
		return `data:image/png;base64,${buffer.toString('base64')}`;
	} catch {
		return null;
	}
}

export async function cleanOgOutputFolder(slugs) {
	await mkdir(ogOutputDir, { recursive: true });
	const entries = await readdir(ogOutputDir);
	const plannedNames =
		Array.isArray(slugs) && slugs.length > 0 ? new Set(slugs.map((slug) => `${slug}.png`)) : null;
	await Promise.all(
		entries
			.filter((name) => {
				if (!name.endsWith('.png')) return false;
				if (!plannedNames) return true;
				return plannedNames.has(name);
			})
			.map((name) => rm(path.join(ogOutputDir, name), { force: true })),
	);
}

export function truncate(text, maxLength) {
	if (!text) return '';
	return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function createCardTree({ title, description, tags, siteTitle, siteUrl, avatarSrc, logoWordmarkSrc }) {
	const accentGradient = 'linear-gradient(120deg, #00FF7F 0%, #9A1AFF 55%, #6E6EFF 100%)';
	const safeSiteTitle =
		typeof siteTitle === 'string' && siteTitle.trim().length > 0 ? siteTitle : 'Astro Blog';
	const shareUrl = 'https://guisso.dev';
	const normalizedTags =
		Array.isArray(tags) && tags.length > 0 ? tags.slice(0, 3) : ['Insights'];
	const tagElements = normalizedTags.map((tag) => ({
		type: 'div',
		props: {
			style: {
				display: 'flex',
				alignItems: 'center',
				padding: '8px 18px',
				borderRadius: '999px',
				border: '1px solid rgba(255,255,255,0.25)',
				color: '#F5F5FF',
				fontSize: '20px',
				letterSpacing: '0.18em',
				marginRight: '14px',
				marginBottom: '12px',
			},
			children: [String(tag).toUpperCase()],
		},
	}));
	const avatarNode = avatarSrc
		? {
				type: 'img',
				props: {
					src: avatarSrc,
					width: 96,
					height: 96,
					style: {
						width: '96px',
						height: '96px',
						borderRadius: '999px',
						border: '4px solid rgba(0,255,127,0.35)',
					},
				},
			}
		: {
				type: 'div',
				props: {
					style: {
						width: '96px',
						height: '96px',
						borderRadius: '999px',
						background: accentGradient,
						color: '#050505',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '32px',
						fontWeight: 600,
					},
					children: [
						(() => {
							const source = safeSiteTitle || 'GG';
							const parts = source.trim().split(/\s+/).slice(0, 2);
							const letters = parts.map((part) => part.charAt(0).toUpperCase()).filter(Boolean);
							return letters.length > 0 ? letters.join('') : 'GG';
						})(),
					],
				},
			};

	const logoChildren = logoWordmarkSrc
		? [
					{
						type: 'img',
						props: {
							src: logoWordmarkSrc,
							width: 130,
							height: 50,
							style: {
								width: '130px',
								height: '50px',
								objectFit: 'contain',
								objectPosition: 'left center',
							},
						},
					},
			]
		: [
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										width: '56px',
										height: '56px',
										borderRadius: '16px',
										background: accentGradient,
									},
								},
							},
							{
								type: 'div',
								props: {
									style: {
										marginLeft: '18px',
										display: 'flex',
										flexDirection: 'column',
									},
									children: [
										{
											type: 'span',
											props: {
												style: {
													fontSize: '18px',
													letterSpacing: '0.4em',
													color: '#A8A9BB',
												},
												children: ['BLOG'],
											},
										},
										{
											type: 'span',
											props: {
												style: {
													fontFamily: 'Oferta do Dia',
													fontSize: '40px',
												},
												children: [safeSiteTitle],
											},
										},
									],
								},
							},
						],
					},
				},
			];

	const bodyChildren = [
		{
			type: 'h1',
			props: {
				style: {
					fontFamily: 'Space Grotesk',
					fontWeight: 700,
					fontSize: '60px',
					lineHeight: '1.08',
					color: '#F5F5FF',
					marginTop: '4px',
					marginBottom: '16px',
					maxWidth: '920px',
				},
				children: [title],
			},
		},
	];

	if (description) {
		bodyChildren.push({
			type: 'p',
			props: {
				style: {
					fontSize: '26px',
					lineHeight: '1.4',
					color: '#D2D3E4',
					marginBottom: '26px',
				},
				children: [description],
			},
		});
	}

	if (tagElements.length > 0) {
		bodyChildren.push({
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexWrap: 'wrap',
					maxWidth: '880px',
				},
				children: tagElements,
			},
		});
	}

	return {
		type: 'div',
		props: {
			style: {
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				padding: '64px 72px',
				backgroundColor: '#040306',
				backgroundImage:
					'linear-gradient(135deg, rgba(0,255,127,0.16), rgba(154,26,255,0.12), rgba(110,110,255,0.18))',
				color: '#F5F5FF',
				fontFamily: 'Inter',
				justifyContent: 'space-between',
				position: 'relative',
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '32px',
						},
							children: logoChildren,
					},
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							flexDirection: 'column',
							flexGrow: 1,
							justifyContent: 'flex-start',
							maxWidth: '960px',
							marginTop: '8px',
							marginBottom: '8px',
						},
						children: bodyChildren,
					},
				},
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginTop: '12px',
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										alignItems: 'center',
									},
									children: [
										avatarNode,
										{
											type: 'div',
											props: {
												style: {
													marginLeft: '18px',
													display: 'flex',
													flexDirection: 'column',
												},
												children: [
													{
														type: 'span',
														props: {
															style: {
																fontSize: '26px',
																fontWeight: 600,
															},
															children: ['Fernando Guisso'],
														},
													},
													{
														type: 'span',
														props: {
															style: {
																fontSize: '18px',
																color: '#A8A9BB',
															},
															children: ['Engineering & Security'],
														},
													},
												],
											},
										},
									],
								},
							},
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-end',
									},
									children: [
							{
								type: 'span',
								props: {
									style: {
										fontSize: '22px',
										fontWeight: 600,
										letterSpacing: '0.08em',
									},
									children: [shareUrl],
								},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	};
}

export async function renderOgImageBuffer(post, fonts, siteMeta, assets) {
	// Keep the title within ~2 lines (1056px usable width, 70px font ≈ 18px per glyph).
	const TITLE_MAX_CHARS = 24;
	// Description uses 26px font, safest around 3 lines before colliding with footer.
	const DESCRIPTION_MAX_CHARS = 150;
	const tree = createCardTree({
		title: truncate(post.title, TITLE_MAX_CHARS),
		description: truncate(post.description, DESCRIPTION_MAX_CHARS),
		tags: post.tags,
		siteTitle: siteMeta.title,
		siteUrl: siteMeta.url,
		avatarSrc: assets?.avatarSrc ?? null,
		logoWordmarkSrc: assets?.logoWordmarkSrc ?? null,
	});
	const svg = await satori(tree, {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts,
	});
	const resvg = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: OG_WIDTH * RENDER_SCALE,
		},
		background: '#020204',
	});
	const png = resvg.render().asPng();
	if (RENDER_SCALE === 1) {
		return png;
	}
	return sharp(png)
		.resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
		.png({ compressionLevel: 9 })
		.toBuffer();
}
