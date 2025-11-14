<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" encoding="UTF-8" indent="yes" />

	<xsl:template match="/">
		<html lang="pt-BR">
			<head>
				<meta charset="UTF-8" />
				<title>
					<xsl:value-of select="rss/channel/title" />
				</title>
				<style>
					:root {
						--bg: #050509;
						--card: rgba(12, 12, 18, 0.85);
						--fg: #f5f5ff;
						--muted: #9da0c2;
						--accent-green: #00ff7f;
						--accent-purple: #9a1aff;
						--accent-blue: #6e6eff;
						--radius: 1.25rem;
						--gradient: linear-gradient(135deg, var(--accent-green), var(--accent-purple), var(--accent-blue));
					}
					* {
						box-sizing: border-box;
					}
					body {
						margin: 0;
						font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
						background: radial-gradient(circle at top left, rgba(0, 255, 127, 0.12), transparent 45%),
							radial-gradient(circle at bottom right, rgba(154, 26, 255, 0.12), transparent 40%),
							var(--bg);
						color: var(--fg);
						min-height: 100vh;
						padding: 3rem 1.5rem;
					}
					.page-shell {
						max-width: 960px;
						margin: 0 auto;
					}
					header {
						text-align: center;
						margin-bottom: 2rem;
					}
					h1 {
						font-family: 'Oferta do Dia', 'Inter', sans-serif;
						font-size: clamp(2rem, 4vw, 3rem);
						margin-bottom: 0.75rem;
						background: var(--gradient);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
					}
					.feed-description {
						color: var(--muted);
						max-width: 720px;
						margin: 0 auto 1rem;
						line-height: 1.6;
					}
					.feed-home {
						display: inline-flex;
						align-items: center;
						justify-content: center;
						padding: 0.4rem 1rem;
						border-radius: 999px;
						border: 1px solid rgba(255, 255, 255, 0.2);
						color: var(--fg);
						text-decoration: none;
						font-size: 0.9rem;
					}
					.feed-item {
						list-style: none;
						margin: 0;
						padding: 0;
						display: flex;
						flex-direction: column;
						gap: 1.5rem;
					}
					.feed-card {
						background: var(--card);
						border-radius: var(--radius);
						padding: 1.75rem;
						box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
						border: 1px solid rgba(255, 255, 255, 0.04);
					}
					.feed-card h2 {
						margin: 0 0 0.5rem;
						font-size: 1.4rem;
					}
					.feed-card h2 a {
						color: inherit;
						text-decoration: none;
					}
					.feed-card p {
						margin: 0 0 1rem;
						color: var(--muted);
						line-height: 1.6;
					}
					.feed-card__meta {
						display: flex;
						flex-wrap: wrap;
						gap: 0.75rem;
						align-items: center;
						font-size: 0.9rem;
						color: var(--muted);
					}
					.feed-chip {
						padding: 0.2rem 0.85rem;
						border-radius: 999px;
						border: 1px solid rgba(255, 255, 255, 0.2);
						text-transform: uppercase;
						font-size: 0.75rem;
						letter-spacing: 0.2em;
					}
					.feed-date {
						font-weight: 600;
						color: var(--accent-green);
					}
				</style>
			</head>
			<body>
				<div class="page-shell">
					<header>
						<h1>
							<xsl:value-of select="rss/channel/title" />
						</h1>
						<p class="feed-description">
							<xsl:value-of select="rss/channel/description" />
						</p>
						<a href="{rss/channel/homeLink}" class="feed-home">← Voltar para home</a>
					</header>
					<ul class="feed-item">
						<xsl:for-each select="rss/channel/item">
							<li class="feed-card">
								<h2>
									<a href="{link}">
										<xsl:value-of select="title" />
									</a>
								</h2>
								<p>
									<xsl:value-of select="description" />
								</p>
								<div class="feed-card__meta">
									<span class="feed-date">
										<xsl:value-of select="pubDate" />
									</span>
									<xsl:for-each select="category">
										<span class="feed-chip">
											<xsl:value-of select="." />
										</span>
									</xsl:for-each>
								</div>
							</li>
						</xsl:for-each>
					</ul>
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
