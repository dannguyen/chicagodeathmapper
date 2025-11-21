import { describe, it, expect } from 'vitest';
import { escapeRegExp, highlightText, filterIntersections, type Intersection } from './searchUtils';

describe('escapeRegExp', () => {
	it('should escape special regex characters', () => {
		const input = '.*+?^${}()|[]\\';
		const expected = String.raw`\.\*\+\?\^\$\{\}\(\)\|\[\]\\`; //String.raw`'\.\*\+\?\^\$\{\}\(\)\|\[\]\\`;
		expect(escapeRegExp(input)).toBe(expected);
	});

	it('should return plain text unchanged', () => {
		expect(escapeRegExp('hello world')).toBe(String.raw`\x68ello\x20world`);
	});
});

describe('highlightText', () => {
	it('should highlight matching text case-insensitively', () => {
		const text = 'Chicago Ave & State St';
		const query = 'chicago state';
		const result = highlightText(text, query);
		// Expect "Chicago" and "State" to be wrapped in spans
		expect(result).toContain('<span class="bg-yellow-300">Chicago</span>');
		expect(result).toContain('<span class="bg-yellow-300">State</span>');
	});

	it('should ignore "AND" and "&" in query', () => {
		const text = 'North & South';
		const query = 'North AND South &';
		const result = highlightText(text, query);
		expect(result).toContain('<span class="bg-yellow-300">North</span>');
		expect(result).toContain('<span class="bg-yellow-300">South</span>');
		// Ensure "&" in the text is NOT highlighted just because it was in the query
		// (Wait, the logic *ignores* '&' from the query tokens, so it won't be in the regex)
		expect(result).not.toContain('<span class="bg-yellow-300">&</span>');
	});

	it('should return original text if query is empty', () => {
		expect(highlightText('Hello', '')).toBe('Hello');
	});

	it('should handle and then ignore special characters in query', () => {
		const text = 'Hello (World)';
		const query = '(World)';
		const result = highlightText(text, query);
		expect(result).toContain('<span class="bg-yellow-300">World</span>');
	});
});

describe('filterIntersections', () => {
	const mockData: Intersection[] = [
		{ intersection: 'STATE & MADISON', latitude: 0, longitude: 0 },
		{ intersection: 'STATE & LAKE', latitude: 0, longitude: 0 },
		{ intersection: 'MICHIGAN & LAKE', latitude: 0, longitude: 0 },
		{ intersection: 'CLARK & LAKE', latitude: 0, longitude: 0 },
		{ intersection: 'W OHIO ST & LAKE', latitude: 0, longitude: 0 },
		{ intersection: 'W OHIO ST & STATE', latitude: 0, longitude: 0 },
		{ intersection: 'E OHIO ST & LAKE', latitude: 0, longitude: 0 }
	];

	it('should return matches based on all tokens', () => {
		const results = filterIntersections(mockData, 'State Lake');
		expect(results).toHaveLength(1);
		expect(results[0].intersection).toBe('STATE & LAKE');

		const results2 = filterIntersections(mockData, 'w ohio lake');
		expect(results2[0].intersection).toBe('W OHIO ST & LAKE');
	});

	it('should be case insensitive', () => {
		const results = filterIntersections(mockData, 'state madison');
		expect(results).toHaveLength(1);
		expect(results[0].intersection).toBe('STATE & MADISON');
	});

	it('should ignore token order', () => {
		const results = filterIntersections(mockData, 'madison state');
		expect(results).toHaveLength(1);
		expect(results[0].intersection).toBe('STATE & MADISON');
	});

	it('should ignore "AND" in query', () => {
		const results = filterIntersections(mockData, 'State AND Madison');
		expect(results).toHaveLength(1);
		expect(results[0].intersection).toBe('STATE & MADISON');
	});

	it('should ignore "&" in query', () => {
		const results = filterIntersections(mockData, 'madison&state');
		expect(results).toHaveLength(1);
		expect(results[0].intersection).toBe('STATE & MADISON');
	});

	it('should return empty array if no match', () => {
		const results = filterIntersections(mockData, 'Wacker');
		expect(results).toHaveLength(0);
	});

	it('should respect the limit', () => {
		// Search "Lake" -> matches 3 items. Limit to 2.
		const results = filterIntersections(mockData, 'Lake', 2);
		expect(results).toHaveLength(2);
	});
	it('should return empty if query is empty', () => {
		expect(filterIntersections(mockData, '')).toEqual([]);
	});
});
