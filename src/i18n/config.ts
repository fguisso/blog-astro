import { withBase, withoutBase } from '../utils/paths';

export const SUPPORTED_LOCALES = ['pt', 'en'] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'pt';

export function getLocaleFromRoutePattern(routePattern: string): LocaleCode {
	const [firstSegment] = routePattern.split('/').filter(Boolean);
	if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment as LocaleCode)) {
		return firstSegment as LocaleCode;
	}
	return DEFAULT_LOCALE;
}

export function prefixForLocale(locale: LocaleCode): string {
	return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

const LOCALE_TO_HTML_LANG: Record<LocaleCode, string> = {
	pt: 'pt-BR',
	en: 'en-US',
};

export function getHtmlLang(locale: LocaleCode): string {
	return LOCALE_TO_HTML_LANG[locale] ?? LOCALE_TO_HTML_LANG[DEFAULT_LOCALE];
}

function normalizePathname(pathname: string) {
	if (!pathname) {
		return '/';
	}

	return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function stripLocaleFromPath(pathname: string, locale: LocaleCode) {
	const normalized = normalizePathname(pathname);
	const prefix = prefixForLocale(locale);

	if (!prefix) {
		return normalized;
	}

	if (normalized === prefix || normalized === `${prefix}/`) {
		return '/';
	}

	if (normalized.startsWith(`${prefix}/`)) {
		const remainder = normalized.slice(prefix.length);
		return remainder.startsWith('/') ? remainder : `/${remainder}`;
	}

	return normalized;
}

export function buildLocaleToggleHref(
	pathname: string,
	search: string,
	fromLocale: LocaleCode,
	toLocale: LocaleCode,
) {
	const pathWithoutBase = withoutBase(pathname);
	const stripped = stripLocaleFromPath(pathWithoutBase, fromLocale);
	const normalized = stripped === '' ? '/' : stripped;
	const targetPrefix = prefixForLocale(toLocale);

	let targetPath: string;
	if (!targetPrefix) {
		targetPath = normalized;
	} else {
		targetPath = normalized === '/' ? `${targetPrefix}/` : `${targetPrefix}${normalized}`;
	}

	const query = search && search !== '?' ? search : '';
	const finalPath = withBase(targetPath);
	return `${finalPath}${query}`;
}

type LocaleSource = {
	locals?: { locale?: LocaleCode };
	currentLocale?: string | undefined;
};

export function getRequestLocale(source?: LocaleSource | null) {
	const fromLocals = source?.locals?.locale;
	if (fromLocals && SUPPORTED_LOCALES.includes(fromLocals)) {
		return fromLocals;
	}

	const fromAstro = source?.currentLocale;
	if (fromAstro && SUPPORTED_LOCALES.includes(fromAstro as LocaleCode)) {
		return fromAstro as LocaleCode;
	}

	return DEFAULT_LOCALE;
}
