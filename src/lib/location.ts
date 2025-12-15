import { getSearchTokens } from '$lib/inputHelpers';
import type { LocationRecord } from '$lib/db';

export class Location {
	name: string;
	category: string;
	longitude: number;
	latitude: number;
	id: string;
	the_geom: string;
	get isShape(): boolean {
		return this.category !== 'intersection';
	}
	get isPoint(): boolean {
		return this.category === 'intersection';
	}

	get pluralCategory(): string {
		return `${this.category}s`;
	}

	constructor(data: LocationRecord) {
		this.name = data.name;
		this.category = data.category;
		this.longitude = data.longitude;
		this.latitude = data.latitude;
		this.id = data.id;
		this.the_geom = data.the_geom;
	}
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
