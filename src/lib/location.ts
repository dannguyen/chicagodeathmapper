import { getSearchTokens } from '$lib/inputHelpers';

export interface Location {
	name: string;
	category: string;
	longitude: number;
	latitude: number;
	id: string;
	the_geom: string;
}

export function filterLocationsBySearchString(
	locations: Location[],
	query: string,
	limit: number = 25
): Location[] {
	if (!query.trim()) return [];

	const tokens = getSearchTokens(query);

	if (tokens.length === 0) return [];

	const results: Location[] = [];

	for (const loc of locations) {
		const name = loc.name;
		if (tokens.every((token) => name.includes(token))) {
			results.push(loc);
			if (results.length >= limit) break;
		}
	}
	return results;
}
