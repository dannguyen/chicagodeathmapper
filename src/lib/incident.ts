export class Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: Date;
	category: string;
	subcategory?: string;
	distance?: number;

	// Constructor now takes raw database row
	constructor(record: any) {
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
		this.subcategory = record.subcategory;
		// Ensure distance is a number and handle undefined or null values
		this.distance = record.distance != null ? parseFloat(record.distance.toFixed(0)) : undefined;
	}
}

export function reifyIncidents(items: any[]): Incident[] {
	let returnItems: Incident[] = [];
	items.forEach((item) => {
		returnItems.push(new Incident(item));
	});

	return returnItems;
}
