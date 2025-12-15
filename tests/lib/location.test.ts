import { describe, it, expect } from 'vitest';
import { filterLocationsBySearchString, Location } from '$lib/location';

describe('Location class', () => {
	const mockData = {
		intersection: {
			id: 'apple',
			name: 'Apple',
			category: 'intersection',
			latitude: 40.1,
			longitude: -80.2,
			the_geom: 'SHAPE([])'
		},

		ward: {
			id: 'banana',
			name: 'Banana',
			category: 'ward',
			latitude: 40.1,
			longitude: -80.2,
			the_geom: 'SHAPE([])'
		},

		neighborhood: {
			id: 'cherry',
			name: 'Cherryville',
			category: 'neighborhood',
			latitude: 40.3,
			longitude: -80.4,
			the_geom: 'SHAPE([])'
		}
	};

	it('should have a constructor', () => {
		const c: Location = new Location(mockData['intersection']);
		expect(c.name).toBe('Apple');
		expect(c.id).toBe('apple');
		expect(typeof c.the_geom).toBe('string');
	});

	it('should not be a shape if intersection', () => {
		const c: Location = new Location(mockData['intersection']);
		expect(c.category).toBe('intersection');
		expect(c.isShape).toBe(false);
		expect(c.isPoint).toBe(true);
	});

	it('should be a shape if NOT intersection', () => {
		const c: Location = new Location(mockData['ward']);
		expect(c.category).toBe('ward');
		expect(c.isShape).toBe(true);
		expect(c.isPoint).toBe(false);
	});

	it('should return the plural form of the category', () => {
		const intersection = new Location(mockData.intersection);
		expect(intersection.pluralCategory).toBe('intersections');

		const ward = new Location(mockData.ward);
		expect(ward.pluralCategory).toBe('wards');

		const neighborhood = new Location(mockData.neighborhood);
		expect(neighborhood.pluralCategory).toBe('neighborhoods');
	});
});

describe('filterLocationsBySearchString', () => {
	const mockData: Location[] = [
		{
			category: 'placeholder',
			name: 'STATE & LAKE',
			latitude: 0,
			longitude: 0,
			id: 'aaa',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'STATE & MADISON',
			latitude: 0,
			longitude: 0,
			id: 'bb',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'MICHIGAN & LAKE',
			latitude: 0,
			longitude: 0,
			id: 'cc',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'CLARK & LAKE',
			latitude: 0,
			longitude: 0,
			id: 'd',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'W OHIO ST & LAKE',
			latitude: 0,
			longitude: 0,
			id: 'e',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'W OHIO ST & STATE',
			latitude: 0,
			longitude: 0,
			id: 'f',
			the_geom: 'hello'
		},
		{
			category: 'intersection',
			name: 'E OHIO ST & LAKE',
			latitude: 0,
			longitude: 0,
			id: 'g',
			the_geom: 'hello'
		}
	].map((d) => new Location(d));

	it('should return matches based on all tokens', () => {
		const results = filterLocationsBySearchString(mockData, 'State Lake');
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('STATE & LAKE');
		expect(results[0].id).toBe('aaa');
		expect(results[0].category).toBe('placeholder');

		const results2 = filterLocationsBySearchString(mockData, 'w ohio lake');
		expect(results2[0].name).toBe('W OHIO ST & LAKE');
	});

	it('should be case insensitive', () => {
		const results = filterLocationsBySearchString(mockData, 'state madison');
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('STATE & MADISON');
	});

	it('should ignore token order', () => {
		const results = filterLocationsBySearchString(mockData, 'madison state');
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('STATE & MADISON');
	});

	it('should ignore "AND" in query', () => {
		const results = filterLocationsBySearchString(mockData, 'State AND Madison');
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('STATE & MADISON');
	});

	it('should ignore "&" in query', () => {
		const results = filterLocationsBySearchString(mockData, 'madison&state');
		expect(results).toHaveLength(1);
		expect(results[0].name).toBe('STATE & MADISON');
	});

	it('should return empty array if no match', () => {
		const results = filterLocationsBySearchString(mockData, 'Wacker');
		expect(results).toHaveLength(0);
	});

	it('should respect the limit', () => {
		// Search "Lake" -> matches 3 items. Limit to 2.
		const results = filterLocationsBySearchString(mockData, 'Lake', 2);
		expect(results).toHaveLength(2);
	});
	it('should return empty if query is empty', () => {
		expect(filterLocationsBySearchString(mockData, '')).toEqual([]);
	});
});
