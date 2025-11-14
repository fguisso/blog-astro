const rawBase = import.meta.env.BASE_URL ?? '/';
const normalizedBase = rawBase === '/' ? '' : rawBase.replace(/\/$/, '');

function hasBasePrefix(path: string) {
	if (!normalizedBase) {
		return false;
	}

	return path === normalizedBase || path.startsWith(`${normalizedBase}/`);
}

export function withBase(path: string) {
	if (!path.startsWith('/')) {
		return path;
	}

	if (!normalizedBase) {
		return path;
	}

	if (path === '/' || path === `${normalizedBase}/`) {
		return `${normalizedBase}/`;
	}

	if (hasBasePrefix(path)) {
		return path;
	}

	return `${normalizedBase}${path}`;
}

export function withoutBase(pathname: string) {
	if (!pathname.startsWith('/')) {
		return pathname;
	}

	if (!normalizedBase) {
		return pathname;
	}

	if (pathname === normalizedBase || pathname === `${normalizedBase}/`) {
		return '/';
	}

	if (pathname.startsWith(`${normalizedBase}/`)) {
		return pathname.slice(normalizedBase.length);
	}

	return pathname;
}
