import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

import { resolve } from '$app/paths';

export interface DatabaseConnection {
	db: SqlJsDatabase | null;
}

export async function initDb(dbUrl: string): Promise<SqlJsDatabase> {
	const SQL = await initSqlJs({
		// Locate the wasm file in the static directory
		locateFile: (file) => resolve(`/${file}`)
	});

	const response = await fetch(dbUrl);
	const buffer = await response.arrayBuffer();

	return new SQL.Database(new Uint8Array(buffer));
}

export function registerGeospatialFunctions(db: SqlJsDatabase) {
	db.create_function(
		'HAVERSINE_DISTANCE',
		(lat1: number, lon1: number, lat2: number, lon2: number) => {
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
	);
}
