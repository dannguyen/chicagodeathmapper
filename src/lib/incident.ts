import type { IncidentRecord } from '$lib/db';

export class Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: Date;
	category: string;
	subcategory?: string;
	distance?: number;

	// Constructor now takes raw database row
	constructor(record: IncidentRecord) {
		this.longitude = record.longitude;
		this.latitude = record.latitude;
		// Construct title from raw fields, providing fallback for undefined values
		this.title =
			`${record.injuries_fatal ?? 'Unknown'} fatalities in ` +
			`${record.crash_type ?? 'Unknown'} on ` +
			`${record.street_no ?? ''} ${record.street_direction ?? ''} ` +
			`${record.street_name ?? 'Unknown Street'}`;
		this.date = new Date(Date.parse(record.crash_date));
		this.category = record.prim_contributory_cause ?? 'Unknown Category';
		this.subcategory = record.subcategory ?? undefined;
		// Ensure distance is a number and handle undefined or null values
		this.distance = record.distance != null ? parseFloat(record.distance.toFixed(0)) : undefined;
	}

	get prettyDate(): string {
		return this.date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
}

export function reifyIncidents(items: IncidentRecord[]): Incident[] {
	return items.map((item) => new Incident(item));
}
