import initSqlite from '@sqlite.org/sqlite-wasm';
import { resolve } from '$app/paths';

export type DbInstance = InstanceType<typeof sqlite3.oo1.DB>;

export interface DatabaseConnection {
	db: DbInstance | null;
}

export async function initDb(dbUrl: string): Promise<DbInstance> {
	const sqlite3 = await initSqlite({
		locateFile: (name) => resolve(`/${name}`)
	});

	const capi = sqlite3.capi;
	const wasm = sqlite3.wasm;

	const buf = await fetch(dbUrl).then((r) => r.arrayBuffer());
	const bytes = new Uint8Array(buf);

	// allocate WASM memory and copy DB bytes in
	const p = wasm.allocFromTypedArray(bytes);

	// create empty DB
	const db = new sqlite3.oo1.DB();

	// deserialize bytes into DB
	const rc = capi.sqlite3_deserialize(
		db.pointer,
		'main',
		p,
		bytes.length,
		bytes.length,
		capi.SQLITE_DESERIALIZE_FREEONCLOSE | capi.SQLITE_DESERIALIZE_READONLY
	);

	if (rc) throw new Error('deserialize failed');

	registerGeospatialFunctions(db);

	return db;
}

export function registerGeospatialFunctions(db: DbInstance) {
	db.createFunction({
		name: 'HAVERSINE_DISTANCE',
		arity: 4,
		deterministic: true,
		xFunc: (ctxPtr, lat1: number, lon1: number, lat2: number, lon2: number) => {
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

export function queryNearestToLocation(
	conn: DatabaseConnection,
	location: Location,
	maxDistance: number = 5280,
	limit: number = 10
): any[] {
	if (!conn.db) return;

	const results: any[] = conn.db.exec({
		sql: `
		  SELECT *, HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) as distance
          FROM incidents
          ORDER BY distance ASC
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
	return results.filter((row) => {
		return row.distance <= maxDistance;
	});
}
