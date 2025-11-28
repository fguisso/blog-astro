import type { AstroIntegration } from 'astro';

interface TianjiOptions {
	trackerUrl: string;
	websiteId: string;
	domains?: string[];
	enabled?: boolean;
	disableInDev?: boolean;
}

export default function tianjiIntegration(options: TianjiOptions): AstroIntegration {
	const {
		trackerUrl,
		websiteId,
		domains,
		enabled = true,
		disableInDev = true,
	} = options;

	return {
		name: 'tianji-integration',
		hooks: {
			'astro:config:setup': ({ injectScript, command }) => {
				// Skip injection when explicitly disabled.
				if (!enabled) return;

				// Skip during dev to avoid noise on preview environments.
				if (disableInDev && command === 'dev') return;

				const domainAttribute = domains?.length
					? `s.setAttribute('data-domains', '${domains.join(',')}');`
					: '';

				// Inject Tianji tracker script globally (privacy-first, no cookies, <2 KB).
				// Written as a local plugin so it can be extracted to a future astro-tianji package.
				injectScript(
					'page',
					`(function(){if(typeof document==='undefined')return;` +
						`if(document.querySelector('script[data-website-id="${websiteId}"]'))return;` +
						`const s=document.createElement('script');` +
						`s.async=true;s.defer=true;` +
						`s.src='${trackerUrl}';` +
						`s.setAttribute('data-website-id','${websiteId}');` +
						`${domainAttribute}` +
						`document.head.appendChild(s);})();`
				);
			},
		},
	};
}
