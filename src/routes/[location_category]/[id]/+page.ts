import type { PageLoad } from './$types';
import { queryLocationById } from '$lib/db';
import { ensureDatabase } from '$lib/appInit';
import { appState } from '$lib/components/AppState.svelte';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	const id = params.id;

	if (!appState.database) {
		try {
			await ensureDatabase();
		} catch (e) {
			throw error(500, 'Database not initialized.');
		}
	}

	const location = queryLocationById(appState.database, id);

	if (!location) {
		throw error(404, `Location with ID \'${id}\' not found.`);
	}

	return {
		location
	};
};
