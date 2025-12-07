import type { Location } from '$lib/location';
import type { Incident } from '$lib/incident';
import type { DatabaseConnection } from '$lib/db';

export const appState = $state({
	database: null as DatabaseConnection | null,
	selectedLocation: null as Location | null,
	incidents: [] as Incident[],
	selectedIncident: null as Incident | null,
	maxDistance: 5280,
	distanceUnits: 'feet'
});
