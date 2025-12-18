import { assets } from '$app/paths';
import { DatabaseConnection } from '$lib/db';
import { appState } from '$lib/components/AppState.svelte';

/**
 * Ensure there is a singleton database connection in appState.
 * Safe to call multiple times; will reuse existing connection.
 */
export async function ensureDatabase(): Promise<DatabaseConnection> {
	if (appState.database?.db) {
		return appState.database;
	}

	const databasePath = `${assets}/database.sqlite`;
	const conn = new DatabaseConnection(databasePath);
	await conn.init();
	appState.database = conn;
	return conn;
}
