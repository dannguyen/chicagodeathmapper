export interface Intersection {
	intersection: string;
	longitude: number;
	latitude: number;
}

export function escapeRegExp(str: string): string {
	return RegExp.escape(str);
}

export function getSearchTokens(query: string): string[] {
	return query
		.toUpperCase()
		.split(/\W+/)
		.filter((token) => token !== 'AND' && token.replace(/\W+/g, '').trim() !== '');
}

export function highlightText(text: string, query: string): string {
	const tokens = getSearchTokens(query);

	if (!tokens || tokens.length === 0) {
		return text;
	}

	const escapedTokens = tokens.map((token) => escapeRegExp(token));
	const pattern = escapedTokens.join('|');
	const regex = new RegExp(`(${pattern})`, 'gi');

	return text.replace(regex, '<span class="bg-yellow-300">$1</span>');
}

export function filterIntersections(
	intersections: Intersection[],
	query: string,
	limit: number = 25
): Intersection[] {
	if (!query.trim()) return [];

	const tokens = getSearchTokens(query);

	if (tokens.length === 0) return [];

	const results: Intersection[] = [];

	for (const intersection of intersections) {
		const name = intersection.intersection;
		if (tokens.every((token) => name.includes(token))) {
			results.push(intersection);
			if (results.length >= limit) break;
		}
	}
	return results;
}
