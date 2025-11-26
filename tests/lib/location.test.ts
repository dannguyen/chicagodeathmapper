import { describe, it, expect } from 'vitest';
import { filterLocationsBySearchString, type Location } from '$lib/location';

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
	];

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
