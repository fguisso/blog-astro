#!/usr/bin/env node
import http from 'node:http';
import url from 'node:url';
import {
	loadAvatarDataUrl,
	loadFonts,
	loadPostsFromContentStore,
	log,
	readSiteMeta,
	renderOgImageBuffer,
	runAstroSync,
} from './og-shared.mjs';

const PORT = Number(process.env.OG_PREVIEW_PORT ?? 4510);

await runAstroSync();
let fonts = await loadFonts();
let siteMeta = await readSiteMeta();
let posts = await loadPostsFromContentStore();
let avatarSrc = await loadAvatarDataUrl();

function refreshData() {
	return Promise.all([loadFonts(), readSiteMeta(), loadPostsFromContentStore(), loadAvatarDataUrl()]).then(
		([loadedFonts, meta, loadedPosts, avatar]) => {
			fonts = loadedFonts;
			siteMeta = meta;
			posts = loadedPosts;
			avatarSrc = avatar;
		},
	);
}

const server = http.createServer(async (req, res) => {
	if (!req.url) {
		res.writeHead(400).end('Missing URL');
		return;
	}

	const parsedUrl = url.parse(req.url, true);
	if (parsedUrl.pathname === '/refresh' && req.method === 'POST') {
		try {
			await runAstroSync();
			await refreshData();
			res.writeHead(200, { 'Content-Type': 'application/json' }).end(
				JSON.stringify({ status: 'ok', posts: posts.length }),
			);
		} catch (error) {
			res.writeHead(500, { 'Content-Type': 'application/json' }).end(
				JSON.stringify({ status: 'error', message: error.message }),
			);
		}
		return;
	}

	if (parsedUrl.pathname?.startsWith('/og/') && parsedUrl.pathname.endsWith('.png')) {
		const slug = decodeURIComponent(parsedUrl.pathname.replace(/^\/og\//, '').replace(/\.png$/, ''));
		const post = posts.find((entry) => entry.slug === slug);
		if (!post) {
			res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
			return;
		}
		try {
			const png = await renderOgImageBuffer(post, fonts, siteMeta, { avatarSrc });
			res.writeHead(200, {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store',
			});
			res.end(png);
		} catch (error) {
			res.writeHead(500, { 'Content-Type': 'text/plain' }).end(error.message);
		}
		return;
	}

	const list = posts
		.map(
			(post) => `
				<article>
					<h2>${post.title}</h2>
					<p>${post.description}</p>
					<img src="/og/${encodeURIComponent(post.slug)}.png" alt="${post.title}" loading="lazy" />
				</article>
`,
		)
		.join('\n');

	const page = `<!doctype html>
<html lang="pt-BR">
<head>
	<meta charset="utf-8" />
	<title>OG Preview</title>
	<style>
		body {
			font-family: Inter, system-ui, sans-serif;
			background: #020204;
			color: #f5f5ff;
			margin: 0;
			padding: 2rem;
		}
		main {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
			gap: 2rem;
		}
		article {
			background: #131318;
			border-radius: 16px;
			padding: 1.5rem;
			box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
		}
		img {
			width: 100%;
			height: auto;
			border-radius: 12px;
			margin-top: 1rem;
		}
		button {
			background: linear-gradient(90deg, #00ff7f, #9a1aff, #6e6eff);
			border: none;
			color: #020204;
			padding: 0.75rem 1.5rem;
			border-radius: 999px;
			font-weight: bold;
			cursor: pointer;
			margin-bottom: 2rem;
		}
	</style>
</head>
<body>
	<h1>Open Graph Preview</h1>
	<p>Pré-visualize os cartões OG gerados automaticamente.</p>
	<button id="refresh">Recarregar conteúdo</button>
	<main>${list}</main>
	<script type="module">
		document.getElementById('refresh').addEventListener('click', async () => {
			const btn = document.getElementById('refresh');
			btn.disabled = true;
			btn.textContent = 'Atualizando...';
			await fetch('/refresh', { method: 'POST' });
			location.reload();
		});
	</script>
</body>
</html>`;

	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
});

server.listen(PORT, () => {
	log(`OG preview server running at http://localhost:${PORT}`);
	log('Use /refresh to resync content after editing posts.');
});
