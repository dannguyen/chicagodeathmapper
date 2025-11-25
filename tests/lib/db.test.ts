import { describe, it, expect, vi } from 'vitest';
import {
	maxLimit,
	queryNearestToLocation,
	registerGeospatialFunctions,
	type DbInstance,
	type DatabaseConnection
} from '$lib/db';
import type { Location } from '$lib/location';

// Mock $app/paths
vi.mock('$app/paths', () => ({
	resolve: (path: string) => path
}));

// Mock @sqlite.org/sqlite-wasm
const mockSqlite = {
	oo1: {
		DB: class MockDB {
			pointer = 123;
		}
	},
	capi: {
		sqlite3_deserialize: vi.fn(),
		SQLITE_DESERIALIZE_FREEONCLOSE: 1,
		SQLITE_DESERIALIZE_READONLY: 2
	},
	wasm: {
		allocFromTypedArray: vi.fn(() => 456)
	}
};

vi.mock('@sqlite.org/sqlite-wasm', () => ({
	default: vi.fn(() => Promise.resolve(mockSqlite))
}));

describe('db', () => {
	describe('registerGeospatialFunctions', () => {
		it('should register HAVERSINE_DISTANCE function', () => {
			const mockDb = {
				createFunction: vi.fn()
			} as unknown as DbInstance;

			registerGeospatialFunctions(mockDb);

			expect(mockDb.createFunction).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'HAVERSINE_DISTANCE',
					arity: 4
				})
			);
		});
	});

	describe('haversine function', () => {
		it('should correctly calculate haversine distance', () => {
			const mockDb = {
				createFunction: vi.fn()
			} as unknown as DbInstance;

			registerGeospatialFunctions(mockDb);

			const call = (mockDb.createFunction as any).mock.calls[0][0];
			const haversine = call.xFunc;

			// Test case: Distance between two points
			// Chicago: 41.8781° N, 87.6298° W
			// New York: 40.7128° N, 74.0060° W
			// Distance is approx 712 miles ~ 3,763,000 feet
			// Let's use simpler points or check known formula output.

			// 0,0 to 0,0 -> 0
			expect(haversine(null, 0, 0, 0, 0)).toBe(0);

			// 1 deg lat difference at equator is approx 69 miles = 364320 feet.
			// 6371km * pi/180 * 3.28084 = 364567 feet roughly.
			const res = haversine(null, 0, 0, 1, 0);
			expect(res).toBeGreaterThan(364000);
			expect(res).toBeLessThan(365000);
		});
	});

	describe('queryNearestToLocation', () => {
		const mockLocation: Location = {
			id: '1',
			name: 'Test Loc',
			latitude: 41.8,
			longitude: -87.6
		};

		it('should return undefined if db is null', () => {
			const conn: DatabaseConnection = { db: null };
			// @ts-ignore
			const results = queryNearestToLocation(conn, mockLocation);
			expect(results).toBeUndefined();
		});

		it('should execute SQL and filter results', () => {
			const mockExec = vi.fn();
			const mockDb = {
				exec: mockExec
			} as unknown as DbInstance;
			const conn: DatabaseConnection = { db: mockDb };

			// Mock results from DB (already simulated distance calculation)
			const dbResults = [
				{ id: 1, distance: 100 },
				{ id: 2, distance: 5000 },
				{ id: 3, distance: 6000 } // Should be filtered out by default 5280
			];

			mockExec.mockReturnValue(dbResults);

			const results = queryNearestToLocation(conn, mockLocation);

			expect(mockExec).toHaveBeenCalledWith(
				expect.objectContaining({
					bind: {
						':lat': mockLocation.latitude,
						':lon': mockLocation.longitude,
						':limit': maxLimit
					}
				})
			);

			expect(results).toHaveLength(2);
			expect(results).toEqual([
				{ id: 1, distance: 100 },
				{ id: 2, distance: 5000 }
			]);
		});

		it('should respect maxDistance parameter', () => {
			const mockExec = vi.fn();
			const conn: DatabaseConnection = { db: { exec: mockExec } as unknown as DbInstance };

			mockExec.mockReturnValue([{ distance: 100 }, { distance: 200 }]);

			const results = queryNearestToLocation(conn, mockLocation, 150);
			expect(results).toHaveLength(1);
			expect(results[0].distance).toBe(100);
		});
	});
});
