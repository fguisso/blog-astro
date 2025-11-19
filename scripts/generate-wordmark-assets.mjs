#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const fontsDir = path.join(projectRoot, 'src', 'assets', 'fonts');
const outputDir = path.join(projectRoot, 'public');

const OUTPUT_WIDTH = 900;
const LABEL = 'guisso';
const FONT_STACK = 'Didact Gothic, Oferta do Dia, Inter, sans-serif';

const variants = [
	{ name: 'logo-wordmark', fill: '#F5F5FF', description: 'Default for dark backgrounds' },
	{ name: 'logo-wordmark-dark', fill: '#050505', description: 'Dark on light backgrounds' },
];

const svgTemplate = (fill) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 849.6 329.92" role="img" aria-label="${LABEL} logotipo">
	<title>${LABEL}</title>
	<text transform="translate(5.52 250.66)" font-size="296.85px" font-family="${FONT_STACK}" fill="${fill}">${LABEL}</text>
	<polygon points="60.34 198.02 84.8 150.91 107.45 198.02 60.34 198.02" fill="${fill}" />
	<polygon points="741.17 161.02 765.63 208.13 788.28 161.02 741.17 161.02" fill="${fill}" />
</svg>`;

async function main() {
	await mkdir(outputDir, { recursive: true });
	const fontFiles = [
		path.join(fontsDir, 'DidactGothic-Regular.ttf'),
		path.join(fontsDir, 'Oferta-do-Dia.ttf'),
		path.join(fontsDir, 'Inter-Regular.ttf'),
	];

	for (const variant of variants) {
		const svg = svgTemplate(variant.fill);
		const renderer = new Resvg(svg, {
			background: 'rgba(0,0,0,0)',
			fitTo: {
				mode: 'width',
				value: OUTPUT_WIDTH,
			},
			font: {
				fontFiles,
				loadSystemFonts: false,
				defaultFontFamily: 'Didact Gothic',
			},
		});

		const png = renderer.render().asPng();
		const outPath = path.join(outputDir, `${variant.name}.png`);
		await writeFile(outPath, png);
		console.log(`[wordmark] Generated ${path.basename(outPath)} (${variant.description})`);
	}
}

main().catch((error) => {
	console.error('[wordmark] Failed to generate wordmark PNGs.');
	console.error(error);
	process.exitCode = 1;
});
