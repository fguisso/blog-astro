import en from './en';
import pt from './pt';
import { DEFAULT_LOCALE, type LocaleCode } from './config';

export const messages = {
	pt,
	en,
} as const;

function lookup(locale: LocaleCode, segments: string[]) {
	let current: unknown = messages[locale];

	for (const segment of segments) {
		if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
			current = (current as Record<string, unknown>)[segment];
		} else {
			return undefined;
		}
	}

	return current;
}

export function t(locale: LocaleCode, path: string): string {
	const segments = path.split('.');
	const value = lookup(locale, segments) ?? lookup(DEFAULT_LOCALE, segments);
	return typeof value === 'string' ? value : path;
}
