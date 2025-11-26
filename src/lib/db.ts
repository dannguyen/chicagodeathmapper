import initSqlite from '@sqlite.org/sqlite-wasm';
import { resolve } from '$app/paths';
import type { Location } from './location';
import { base, assets } from '$app/paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbInstance = any;

export const maxLimit: number = 1000;

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

export function registerGeospatialFunctions(db: DbInstance) {
	db.createFunction({
		name: 'HAVERSINE_DISTANCE',
		arity: 4,
		deterministic: true,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		xFunc: (ctxPtr: any, lat1: number, lon1: number, lat2: number, lon2: number) => {
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
	});
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
			SELECT name, category, latitude, longitude, id
			FROM locations
			WHERE ${conditions}
			LIMIT :limit
		`,
		bind,
		rowMode: 'object'
	});

	return results as Location[];
}

export function queryLocationById(conn: DatabaseConnection, id: string): Location | null {
	if (!conn.db) return null;

	const results = conn.db.exec({
		sql: `
			SELECT name, category, latitude, longitude, id
			FROM locations
			WHERE id = :id
			LIMIT 1
		`,
		bind: { ':id': id },
		rowMode: 'object'
	});

	return results.length > 0 ? (results[0] as Location) : null;
}

export function queryNearestToLocation(
	conn: DatabaseConnection,
	location: Location,
	maxDistance: number = 5280,
	limit: number = maxLimit
): any[] {
	if (!conn.db) return [];

	const results: any[] = conn.db.exec({
		sql: `
		  SELECT *, HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) as distance
          FROM incidents
          ORDER BY crash_date desc
          LIMIT :limit
          ;
      `,
		bind: {
			':lat': location.latitude,
			':lon': location.longitude,
			':limit': limit
		},
		rowMode: 'object'
	});
	let filtered = results.filter((row) => {
		return row.distance <= maxDistance;
	});
	return filtered;
}
