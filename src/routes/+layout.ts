import { assets } from '$app/paths';
import { DatabaseConnection } from '$lib/db';
import { appState } from '$lib/components/AppState.svelte';

export const load = async () => {
	// reuse existing database connection if available
	if (!appState.database) {
		const databasePath = `${assets}/database.sqlite`;
		const conn = new DatabaseConnection(databasePath);
		try {
			await conn.init();
			appState.database = conn;
		} catch (error) {
			console.error('Failed to initialize database:', error);
			// In a real app we might handle this gracefully,
			// but for now we let the error propagate or handled by UI checking appState.database
		}
	}
	return {
		database: appState.database
	};
};

export const prerender = false; // Disable prerender if we are doing client-side DB loading that depends on fetch
export const ssr = false; // Disable SSR since we rely on client-side WASM and window/fetch
