# Tianji Website Analytics

## 1. Overview
- Tianji is an open-source suite (analytics + monitor + status), privacy-first (no cookies by default) with a lightweight tracker (< 2 KB).
- Picked for this Astro static blog because it is self-hosted, avoids extra backend, and keeps data footprint minimal.

## 2. How the integration works
- Local integration in `src/integrations/tianji.ts` injects the Tianji script into every page via `injectScript("page", ...)`.
- Options:
  - `trackerUrl`: full URL to `tracker.js` (e.g., `https://tc.guisso.dev/tracker.js`).
  - `websiteId`: value for `data-website-id`.
  - `domains?`: mapped to `data-domains` (limits tracking to these hosts). Includes `localhost`/`127.0.0.1` so local preview emits events.
  - `enabled?` (default `true`): disable without removing code.
  - `disableInDev?` (default `true`): skip during `astro dev`. Currently set to `false` to capture local runs.

## 3. How to enable/disable
- File: `astro.config.mjs`.
- Import and usage:

```js
import tianjiIntegration from "./src/integrations/tianji";

export default defineConfig({
  integrations: [
    tianjiIntegration({
      trackerUrl: "https://tc.guisso.dev/tracker.js",
      websiteId: "cmii1ghp20egvjpnvi3fc0asv",
      domains: ["guisso.dev", "www.guisso.dev", "localhost", "127.0.0.1"],
      disableInDev: false,
    }),
  ],
});
```

- To mute tracking in specific environments, set `enabled: false` or revert `disableInDev` to `true`.

## 4. Recommended events for a personal blog
- `view_post` — payload: none; reason: pageview already captured, keep the name conceptually.
- `read_post` — payload: `data-tianji-event-slug`, `data-tianji-event-depth`; reason: measure “read to end” (button or future JS).
- `click_cta` — payload: `data-tianji-event-location`, `data-tianji-event-label`; reason: primary CTAs (newsletter, contact).
- `outbound_link` — payload: `data-tianji-event-destination`, `data-tianji-event-context`; reason: understand exits (GitHub, Twitter, LinkedIn).
- `share_post` — payload: `data-tianji-event-slug`, `data-tianji-event-platform`; reason: which posts/channels drive shares.
- `search` — payload: `data-tianji-event-query`, `data-tianji-event-results`; reason: tune internal search/content.
- `language_switch` — payload: `data-tianji-event-from`, `data-tianji-event-to`; reason: language demand.
- `theme_toggle` — payload: `data-tianji-event-mode`; reason: light/dark preference (future).
- `copy_code` — payload: `data-tianji-event-snippet`, `data-tianji-event-location`; reason: which code snippets are reused.

## 5. Using `data-tianji-event` in practice
- Basic syntax:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

- With extra payload:

```html
<button
  data-tianji-event="share_post"
  data-tianji-event-slug="hello-world"
  data-tianji-event-platform="twitter">
  Share
</button>
```

- Once the global script is configured, just add these attributes in any HTML/Astro; no custom JS helpers are required.

## 6. Privacy and performance
- Tracker is small (< 2 KB), `async` + `defer`, non-blocking.
- No cookies by default (honors the Tianji self-hosted config).
- Works well for static hosting (GitHub Pages/CDN) without backend dependencies.
