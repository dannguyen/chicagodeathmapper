import { ensureDatabase } from '$lib/appInit';

export const load = async () => {
	// reuse existing database connection if available
	try {
		await ensureDatabase();
	} catch (error) {
		console.error('Failed to initialize database:', error);
	}
	return {
		database: null
	};
};

export const prerender = false; // Disable prerender if we are doing client-side DB loading that depends on fetch
export const ssr = false; // Disable SSR since we rely on client-side WASM and window/fetch
