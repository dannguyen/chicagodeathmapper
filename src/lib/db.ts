import initSqlite from '@sqlite.org/sqlite-wasm';
import wellknown from 'wellknown';
import { resolve } from '$app/paths';
import { Location } from './location';
import type { IncidentRecord } from './incident';
import { base, assets } from '$app/paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbInstance = any;

export interface LocationRecord {
	name: string;
	category: string;
	latitude: number;
	longitude: number;
	id: string;
	the_geom: string;
}

export const maxLimit: number = 1000;

function normalizeDateInput(date: Date | string | null | undefined): string {
	const d = date ? new Date(date) : new Date();
	return d.toISOString().split('T')[0];
}

function haversineDistanceFeet(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (x: number) => (x * Math.PI) / 180;
	const R = 3.28084 * 6371e3; // feet

	const φ1 = toRad(lat1);
	const φ2 = toRad(lat2);
	const Δφ = toRad(lat2 - lat1);
	const Δλ = toRad(lon2 - lon1);

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

export class DatabaseConnection {
	db: DbInstance | null = null;
	url: string;

	constructor(dbUrl: string) {
		this.url = dbUrl;
	}

	async init(): Promise<void> {
		const sqlite3 = await initSqlite({
			locateFile: (name) => `${assets}/${name}`
		});

		const capi = sqlite3.capi;
		const wasm = sqlite3.wasm;

		const buf = await fetch(this.url).then((r) => r.arrayBuffer());
		const bytes = new Uint8Array(buf);

		// allocate WASM memory and copy DB bytes in
		const p = wasm.allocFromTypedArray(bytes);

		// create empty DB
		const db = new sqlite3.oo1.DB();

		// deserialize bytes into DB
		const rc = capi.sqlite3_deserialize(
			db.pointer as number,
			'main',
			p,
			bytes.length,
			bytes.length,
			capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_READONLY
		);

		if (rc) throw new Error('deserialize failed');

		registerGeospatialFunctions(db);

		this.db = db;
	}

	getDatabaseSummary(): { type: string; count: number }[] {
		if (!this.db) return [];

		const results = this.db.exec({
			sql: `
				SELECT
					'Locations' AS type
					, COUNT(1) AS count
				FROM locations
				UNION ALL
				SELECT
					'Incidents' AS type
					, COUNT(1) AS count
				FROM incidents
			`,
			rowMode: 'object'
		});

		return results as { type: string; count: number }[];
	}
}

export async function initDb(dbUrl: string): Promise<DatabaseConnection> {
	const conn = new DatabaseConnection(dbUrl);
	await conn.init();
	return conn;
}

export function registerGeospatialFunctions(db: DbInstance): void {
	db.createFunction({
		name: 'HAVERSINE_DISTANCE',
		arity: 4,
		deterministic: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		xFunc: (ctxPtr: any, lat1: number, lon1: number, lat2: number, lon2: number) => {
			return haversineDistanceFeet(lat1, lon1, lat2, lon2);
		}
	});

	db.createFunction({
		name: 'MakePoint',
		arity: 3,
		deterministic: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		xFunc: (_: any, x: number, y: number, srid: number) => {
			return `POINT (${x} ${y})`;
		}
	});

	let lastGeomWkt = '';
	let lastGeom: any = null;

	db.createFunction({
		name: 'ST_Contains',
		arity: 2,
		deterministic: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		xFunc: (_: any, geomWkt: string, pointWkt: string) => {
			if (!geomWkt || !pointWkt) return 0;

			// Simple Memoization for the polygon geometry
			if (geomWkt !== lastGeomWkt) {
				try {
					lastGeom = wellknown.parse(geomWkt);
					lastGeomWkt = geomWkt;
				} catch (e) {
					return 0;
				}
			}
			if (!lastGeom) return 0;

			// Parse Point (manual parse is faster than wellknown for simple points)
			// pointWkt is "POINT (x y)"
			const match = pointWkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
			if (!match) return 0;
			const x = parseFloat(match[1]);
			const y = parseFloat(match[2]);
			const point = { type: 'Point', coordinates: [x, y] };

			if (lastGeom.type === 'Polygon') {
				return pointInPolygon(point.coordinates, lastGeom.coordinates) ? 1 : 0;
			} else if (lastGeom.type === 'MultiPolygon') {
				return pointInMultiPolygon(point.coordinates, lastGeom.coordinates) ? 1 : 0;
			}

			return 0;
		}
	});
}

// Helper functions for point in polygon check
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointInPolygon(point: any, vs: any) {
	// ray-casting algorithm based on
	// https://github.com/substack/point-in-polygon
	// vs = [ [ [x,y], [x,y]... ], [hole]... ]
	const x = point[0],
		y = point[1];

	let inside = false;
	// Check shell
	const shell = vs[0];
	for (let i = 0, j = shell.length - 1; i < shell.length; j = i++) {
		const xi = shell[i][0],
			yi = shell[i][1];
		const xj = shell[j][0],
			yj = shell[j][1];

		const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}

	if (!inside) return false;

	// Check holes
	for (let h = 1; h < vs.length; h++) {
		const hole = vs[h];
		let insideHole = false;
		for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
			const xi = hole[i][0],
				yi = hole[i][1];
			const xj = hole[j][0],
				yj = hole[j][1];
			const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
			if (intersect) insideHole = !insideHole;
		}
		if (insideHole) return false; // Inside a hole means outside the polygon
	}

	return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointInMultiPolygon(point: any, coords: any) {
	for (let i = 0; i < coords.length; i++) {
		if (pointInPolygon(point, coords[i])) {
			return true;
		}
	}
	return false;
}

export function queryLocationsByName(
	conn: DatabaseConnection,
	searchString: string,
	limit: number = 25
): Location[] {
	if (!conn.db || !searchString.trim()) return [];

	const tokens = searchString
		.toUpperCase()
		.split(/\W+/)
		.filter((token) => token !== 'AND' && token.replace(/\W+/g, '').trim() !== '');

	if (tokens.length === 0) return [];

	const conditions = tokens.map((_, index) => `name LIKE :token${index}`).join(' AND ');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const bind: Record<string, any> = {};
	tokens.forEach((token, index) => {
		bind[`:token${index}`] = `%${token}%`;
	});
	bind[':limit'] = limit;

	const results = conn.db.exec({
		sql: `
			SELECT name, category, latitude, longitude, id, the_geom
			FROM locations
			WHERE ${conditions}
			ORDER BY
				CASE WHEN category = 'intersection' THEN 'zzzz' ELSE category END ASC
			LIMIT :limit
			;

		`,
		bind,
		rowMode: 'object'
	});

	return (results as LocationRecord[]).map((row) => new Location(row));
}

export function queryLocationById(conn: DatabaseConnection, id: string): Location | null {
	if (!conn.db) return null;

	const results = conn.db.exec({
		sql: `
			SELECT name, category, latitude, longitude, id, the_geom
			FROM locations
			WHERE id = :id
			LIMIT 1
		`,
		bind: { ':id': id },
		rowMode: 'object'
	});

	return results.length > 0 ? new Location(results[0] as LocationRecord) : null;
}

export function queryLocationsByCategory(conn: DatabaseConnection, category: string): Location[] {
	if (!conn.db) return [];

	const results = conn.db.exec({
		sql: `
			SELECT name, category, latitude, longitude, id, the_geom
			FROM locations
			WHERE category = :category
			ORDER BY name ASC
		`,
		bind: { ':category': category },
		rowMode: 'object'
	});

	return (results as LocationRecord[]).map((row) => new Location(row));
}

export interface NeighborhoodStat {
	id: string;
	name: string;
	totalIncidents: number;
	mostRecent: string | null;
	avgPerYear: number;
}

export function getAllNeighborhoodStats(conn: DatabaseConnection): NeighborhoodStat[] {
	if (!conn.db) return [];

	// 1. Get all neighborhoods
	const neighborhoods = conn.db.exec({
		sql: `SELECT id, name, the_geom FROM locations WHERE category = 'neighborhood'`,
		rowMode: 'object'
	}) as LocationRecord[];

	// 2. Get all incidents
	const incidents = conn.db.exec({
		sql: `SELECT crash_date, latitude, longitude FROM incidents`,
		rowMode: 'object'
	}) as IncidentRecord[];

	// 3. Prepare neighborhoods with parsed geometries
	const hoodStats = neighborhoods.map((hood) => {
		let geom = null;
		try {
			geom = wellknown.parse(hood.the_geom);
		} catch (e) {
			console.warn(`Failed to parse geometry for ${hood.name}`, e);
		}
		return {
			...hood,
			geom,
			count: 0,
			dates: [] as number[] // timestamps
		};
	});

	// 4. Spatial join
	for (const incident of incidents) {
		const lat = incident.latitude;
		const lon = incident.longitude;
		const date = new Date(incident.crash_date).getTime();

		for (const hood of hoodStats) {
			if (!hood.geom) continue;

			let inside = false;
			// Simple point in polygon check
			if (hood.geom.type === 'Polygon') {
				inside = pointInPolygon([lon, lat], hood.geom.coordinates);
			} else if (hood.geom.type === 'MultiPolygon') {
				inside = pointInMultiPolygon([lon, lat], hood.geom.coordinates);
			}

			if (inside) {
				hood.count++;
				hood.dates.push(date);
				// optimization: an incident is likely in only one neighborhood
				// but strictly speaking, polygons could overlap.
				// For neighborhoods, they usually don't.
				// We can break here if we assume disjoint neighborhoods for performance
				break;
			}
		}
	}

	// 5. Aggregate
	return hoodStats.map((hood) => {
		let mostRecent = null;
		let avgPerYear = 0;

		if (hood.count > 0) {
			const dates = hood.dates.sort((a, b) => a - b);
			mostRecent = new Date(dates[dates.length - 1]).toISOString().split('T')[0];

			const minDate = new Date(dates[0]);
			const maxDate = new Date(dates[dates.length - 1]);
			const yearSpan = maxDate.getFullYear() - minDate.getFullYear();
			// If incidents span less than a year (e.g. same year), divide by 1?
			// Or maybe divide by exact time difference?
			// Request said "Incidents/Year Avg".
			// Let's use (count) / (yearSpan + 1) to avoid division by zero and handle single year.
			// Or if yearSpan is 0, it's count/1.
			avgPerYear = hood.count / (yearSpan + 1);
		}

		return {
			id: hood.id,
			name: hood.name,
			totalIncidents: hood.count,
			mostRecent,
			avgPerYear
		};
	});
}

export interface IntersectionStat {
	id: string;
	name: string;
	count?: number;
	mostRecentDate?: string;
	distance?: number;
}

// Helper to calculate distance in feet between two lat/lon points
function getDistanceInFeet(lat1: number, lon1: number, lat2: number, lon2: number): number {
	return haversineDistanceFeet(lat1, lon1, lat2, lon2);
}

export function getTopIntersectionsByIncidentCount(conn: DatabaseConnection): IntersectionStat[] {
	if (!conn.db) return [];

	// 1. Get all intersections
	const intersections = conn.db.exec({
		sql: `SELECT id, name, latitude, longitude FROM locations WHERE category = 'intersection'`,
		rowMode: 'object'
	}) as LocationRecord[];

	// 2. Get all incidents
	const incidents = conn.db.exec({
		sql: `SELECT latitude, longitude FROM incidents`,
		rowMode: 'object'
	}) as IncidentRecord[];

	// 3. Brute force spatial join (optimized for JS)
	// For each intersection, count incidents within 500 feet
	const stats = intersections.map((loc) => {
		let count = 0;
		for (const inc of incidents) {
			const d = getDistanceInFeet(loc.latitude, loc.longitude, inc.latitude, inc.longitude);
			if (d <= 500) {
				count++;
			}
		}
		return {
			id: loc.id,
			name: loc.name,
			count
		};
	});

	// 4. Sort and take top 10
	return stats.sort((a, b) => b.count - a.count).slice(0, 10);
}

export function getTopIntersectionsByRecentIncidents(conn: DatabaseConnection): IntersectionStat[] {
	if (!conn.db) return [];

	// 1. Get recent incidents (fetch more than 10 to account for duplicates or no match)
	const recentIncidents = conn.db.exec({
		sql: `SELECT latitude, longitude, crash_date FROM incidents ORDER BY crash_date DESC LIMIT 50`,
		rowMode: 'object'
	}) as IncidentRecord[];

	// 2. Get all intersections (caching this in memory would be better if called often,
	// but for a page load it's fine)
	const intersections = conn.db.exec({
		sql: `SELECT id, name, latitude, longitude FROM locations WHERE category = 'intersection'`,
		rowMode: 'object'
	}) as LocationRecord[];

	const results: IntersectionStat[] = [];
	const seenIds = new Set<string>();

	for (const inc of recentIncidents) {
		if (results.length >= 10) break;

		// Find nearest intersection within threshold (e.g. 200 feet)
		let nearest: LocationRecord | null = null;
		let minDist = Infinity;

		for (const loc of intersections) {
			const d = getDistanceInFeet(inc.latitude, inc.longitude, loc.latitude, loc.longitude);
			if (d < minDist && d <= 200) {
				minDist = d;
				nearest = loc;
			}
		}

		if (nearest && !seenIds.has(nearest.id)) {
			seenIds.add(nearest.id);
			results.push({
				id: nearest.id,
				name: nearest.name,
				mostRecentDate: new Date(inc.crash_date).toISOString().split('T')[0],
				distance: Math.round(minDist)
			});
		}
	}

	return results;
}

export function queryIncidentsInsideLocation(
	conn: DatabaseConnection,
	location: Location,
	maxDaysAgo: number = 90,
	selectedDate: Date | string = new Date(),
	limit: number = maxLimit
): IncidentRecord[] {
	if (!conn.db) return [];
	const pastOffset = `-${maxDaysAgo} days`;
	const futureOffset = `+${maxDaysAgo} days`;
	const selectedDateStr = normalizeDateInput(selectedDate);
	const results = conn.db.exec({
		sql: `
			SELECT *
				, NULL as distance
			FROM incidents
			WHERE
				ST_Contains(
					:geom,
					MakePoint(longitude, latitude, 4326)
				)
				AND crash_date BETWEEN DATE(:selectedDate, :pastOffset) AND DATE(:selectedDate, :futureOffset)
			ORDER BY crash_date desc
			LIMIT :limit
			;`,
		bind: {
			':geom': location.the_geom,
			':limit': limit,
			':selectedDate': selectedDateStr,
			':pastOffset': pastOffset,
			':futureOffset': futureOffset
		},
		rowMode: 'object'
	});

	return results as IncidentRecord[];
}

export function queryIncidentsMostRecentNearLocation(
	conn: DatabaseConnection,
	location: Location,
	maxDistance: number = 5280,
	maxDaysAgo: number = 90,
	selectedDate: Date | string = new Date(),
	limit: number = maxLimit
): IncidentRecord[] {
	if (!conn.db) return [];
	const pastOffset = `-${maxDaysAgo} days`;
	const futureOffset = `+${maxDaysAgo} days`;
	const selectedDateStr = normalizeDateInput(selectedDate);

	const results = conn.db.exec({
		sql: `
			SELECT *
				, HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) as distance
			FROM incidents
			WHERE
				crash_date BETWEEN DATE(:selectedDate, :pastOffset) AND DATE(:selectedDate, :futureOffset)
				AND HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) <= :maxDistance
			ORDER BY crash_date desc
			LIMIT :limit
			;`,
		bind: {
			':lat': location.latitude,
			':lon': location.longitude,
			':maxDistance': maxDistance,
			':selectedDate': selectedDateStr,
			':pastOffset': pastOffset,
			':futureOffset': futureOffset,
			':limit': limit
		},
		rowMode: 'object'
	});

	return results as IncidentRecord[];
}

export function queryIncidentsNearestToLocation(
	// to be deprecated soon...
	conn: DatabaseConnection,
	location: Location,
	maxDistance: number = 5280,
	limit: number = maxLimit
): IncidentRecord[] {
	if (!conn.db) return [];

	const results = conn.db.exec({
		sql: `
			SELECT *
				, HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) as distance
			FROM incidents
			WHERE HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) <= :maxDistance
			ORDER BY crash_date desc
			LIMIT :limit
			;`,
		bind: {
			':lat': location.latitude,
			':lon': location.longitude,
			':maxDistance': maxDistance,
			':limit': limit
		},
		rowMode: 'object'
	});

	return results as IncidentRecord[];
}
