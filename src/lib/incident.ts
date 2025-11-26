export class Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: Date;
	category: string;
	subcategory?: string;
	distance?: number;

	constructor(data: {
		longitude: number;
		latitude: number;
		title: string;
		date: Date;
		category: string;
		subcategory?: string;
		distance?: number;
	}) {
		this.longitude = data.longitude;
		this.latitude = data.latitude;
		this.title = data.title;
		this.date = data.date;
		this.category = data.category;
		this.subcategory = data.subcategory;
		this.distance = data.distance;
	}
}

export function reifyIncidents(items: any[]): Incident[] {
	let returnItems: Incident[] = [];
	items.forEach((item) => {
		const incidentData = {
			longitude: item.longitude,
			latitude: item.latitude,
			title: `${item.injuries_fatal} fatalities in ${item.crash_type} on ${item.street_no} ${item.street_direction} ${item.street_name}`,
			category: item.prim_contributory_cause,
			distance: parseFloat(item.distance.toFixed(0)), // Ensure distance is a number
			date: new Date(Date.parse(item.crash_date))
		};
		returnItems.push(new Incident(incidentData));
	});

	return returnItems;
}
