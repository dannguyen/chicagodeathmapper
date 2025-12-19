import type { Location } from '$lib/location';
import type { Incident } from '$lib/incident';
import type { DatabaseConnection } from '$lib/db';

let today: Date = new Date();

export const appState = $state({
	database: null as DatabaseConnection | null,
	selectedLocation: null as Location | null,
	incidents: [] as Incident[],
	selectedIncident: null as Incident | null,
	maxDaysAgo: 540,
	selectedDate: today,
	maxDistance: 2500,
	distanceUnits: 'feet'
});
