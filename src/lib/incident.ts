export interface Incident {
	longitude: number;
	latitude: number;
	title: string;
	date: string;
	category: string;
	subcategory: string;
	distance: number;
}

export function enumerateIncidents(items: any[]) {
	let returnItems: Incident[] = [];
	items.forEach((item) => {
		let i = {
			longitude: item.longitude,
			latitude: item.latitude,
			title: `${item.injuries_fatal} fatalities in ${item.crash_type} on ${item.street_no} ${item.street_direction} ${item.street_name}`,
			category: item.prim_contributory_cause,
			distance: item.distance.toFixed(0),
			date: new Date(Date.parse(item.crash_date))
		};
		returnItems.push(i);
	});

	return returnItems;
}
