export class Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: Date;
	category: string;
	subcategory?: string;
	distance?: number;

	// Constructor now takes raw database row
	constructor(rawItem: any) {
		this.longitude = rawItem.longitude;
		this.latitude = rawItem.latitude;
		// Construct title from raw fields, providing fallback for undefined values
		this.title = `${rawItem.injuries_fatal ?? 'Unknown'} fatalities in ${rawItem.crash_type ?? 'Unknown'} on ${rawItem.street_no ?? ''} ${rawItem.street_direction ?? ''} ${rawItem.street_name ?? 'Unknown Street'}`;
		// Parse date from raw field, ensuring it's a valid Date object
		this.date = new Date(Date.parse(rawItem.crash_date));
		this.category = rawItem.prim_contributory_cause ?? 'Unknown Category';
		this.subcategory = rawItem.subcategory;
		// Ensure distance is a number and handle undefined or null values
		this.distance = rawItem.distance != null ? parseFloat(rawItem.distance.toFixed(0)) : undefined;
	}
}

export function reifyIncidents(items: any[]): Incident[] {
	let returnItems: Incident[] = [];
	items.forEach((item) => {
		returnItems.push(new Incident(item)); // Pass raw item directly to constructor
	});

	return returnItems;
}
