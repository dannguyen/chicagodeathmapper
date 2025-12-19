import type { IncidentRecord } from '$lib/db';
import { prettifyDate } from '$lib/transformHelpers';
export class Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: Date;
	category: string;
	subcategory?: string;
	distance?: number;
	injuries_incapacitating: number;
	injuries_fatal: number;

	// Constructor now takes raw database row
	constructor(record: IncidentRecord) {
		this.longitude = record.longitude;
		this.latitude = record.latitude;
		this.injuries_fatal = record.injuries_fatal;
		this.injuries_incapacitating = record.injuries_incapacitating;

		// Construct title from raw fields, providing fallback for undefined values
		this.title =
			[
				record.injuries_fatal > 0 ? `${record.injuries_fatal} killed` : null,
				record.injuries_incapacitating > 0
					? `${record.injuries_incapacitating} seriously injured`
					: null
			]
				.filter((d) => d !== null)
				.join(', ') +
			` in ${record.crash_type ?? 'Unknown'} on ` +
			`${record.street_no ?? ''} ${record.street_direction ?? ''} ` +
			`${record.street_name ?? 'Unknown Street'}`;
		this.date = new Date(Date.parse(record.crash_date));
		this.category = record.prim_contributory_cause ?? 'Unknown Category';
		this.subcategory = record.subcategory ?? undefined;
		// Ensure distance is a number and handle undefined or null values
		this.distance = record.distance != null ? parseFloat(record.distance.toFixed(0)) : undefined;
	}

	get isFatal(): boolean {
		return this.injuries_fatal > 0;
	}
	get prettyDate(): string {
		return prettifyDate(this.date);
	}
}

export function reifyIncidents(items: IncidentRecord[]): Incident[] {
	return items.map((item) => new Incident(item));
}
