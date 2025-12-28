import { prettifyDate } from '$lib/transformHelpers';

function normalizeString(value: string | null | undefined): string | null {
	return value != null && value.trim() === '' ? null : (value ?? null);
}

export interface PersonRecord {
	person_id?: string | null;
	person_type?: string | null;
	sex?: string | null;
	age?: string | null;
	city?: string | null;
	state?: string | null;
	injury_classification?: string | null;
}

export class Person {
	person_id: string | null;
	person_type: string | null;
	sex: string | null;
	age: number | null;
	city: string | null;
	state: string | null;
	injury: string | null;

	constructor(record: PersonRecord = {}) {
		this.person_id = normalizeString(record.person_id);
		this.person_type = normalizeString(record.person_type);
		this.sex = normalizeString(record.sex);
		const ageValue = normalizeString(record.age);
		const parsedAge = ageValue == null ? null : Number(ageValue);
		this.age = parsedAge == null || Number.isNaN(parsedAge) ? null : parsedAge;
		this.city = normalizeString(record.city);
		this.state = normalizeString(record.state);
		this.injury = normalizeString(record.injury_classification);
	}

	get noun(): string {
		if (this.sex === 'M') {
			return this.age != null && this.age >= 18 ? 'man' : 'boy';
		} else if (this.sex === 'F') {
			return this.age != null && this.age >= 18 ? 'woman' : 'girl';
		} else if (this.age != null && this.age < 1) {
			return 'baby';
		} else {
			return 'person';
		}
	}

	get ageLabel(): string {
		if (this.age != null && this.age < 1) {
			return 'baby';
		} else if (this.age != null && this.age > 0) {
			return `${this.age}-year-old`;
		} else {
			return '(age unknown)';
		}
	}

	get description(): string {
		const thing = [this.ageLabel, this.noun].filter((t) => t != null && t !== '');
		return [...new Set(thing)].join(' ');
	}

	get injury_level(): string {
		if (this.injury === 'FATAL') {
			return 'fatal';
		} else if (this.injury === 'INCAPACITATING INJURY') {
			return 'incapacitating';
		} else if (this.injury === 'NONINCAPACITATING INJURY') {
			return 'non-incapacitating';
		} else if (this.injury === 'NO INDICATION OF INJURY') {
			return 'none';
		} else if (this.injury === 'REPORTED, NOT EVIDENT') {
			return 'unclear';
		} else {
			return 'unknown';
		}
	}

	get isInjured(): boolean {
		return ['fatal', 'incapacitating', 'non-incapacitating', 'unclear'].includes(this.injury_level);
	}

	get isUninjured(): boolean {
		return ['none'].includes(this.injury_level);
	}

	get isKilled(): boolean {
		return this.injury_level === 'fatal';
	}
}

export interface VehicleRecord {
	vehicle_id?: string | null;
	unit_type?: string | null;
	make?: string | null;
	model?: string | null;
	vehicle_year?: string | null;
	vehicle_defect?: string | null;
	vehicle_type?: string | null;
	vehicle_use?: string | null;
	passengers?: PersonRecord[];
}

export class Vehicle {
	vehicle_id: string | null;
	unit_type: string | null;
	make: string | null;
	model: string | null;
	vehicle_year: string | null;
	vehicle_defect: string | null;
	vehicle_type: string | null;
	vehicle_use: string | null;
	passengers: Person[];

	constructor(record: VehicleRecord = {}) {
		this.vehicle_id = normalizeString(record.vehicle_id);
		this.unit_type = normalizeString(record.unit_type);
		this.make = normalizeString(record.make);
		this.model = normalizeString(record.model);
		this.vehicle_year = normalizeString(record.vehicle_year);
		this.vehicle_defect = normalizeString(record.vehicle_defect);
		this.vehicle_type = normalizeString(record.vehicle_type);
		this.vehicle_use = normalizeString(record.vehicle_use);
		this.passengers = (record.passengers ?? []).map((p) => new Person(p));
	}

	get description(): string {
		return [this.vehicle_year, this.make, this.model].filter((x) => x != null).join(' ');
	}
}

export interface IncidentRecord {
	longitude: number;
	latitude: number;
	injuries_fatal: number;
	injuries_incapacitating: number;
	vehicles?: VehicleRecord[] | string | null;
	non_passengers?: PersonRecord[] | string | null;
	crash_type?: string;
	street_no?: string | null;
	street_direction?: string;
	street_name?: string;
	crash_date: string;
	prim_contributory_cause?: string;
	subcategory?: string;
	distance?: number;
}

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
	vehicles: Vehicle[];
	non_passengers: Person[];

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
			` in ${normalizeString(record.crash_type) ?? 'Unknown'} on ` +
			`${normalizeString(record.street_no) ?? ''} ${normalizeString(record.street_direction) ?? ''} ` +
			`${normalizeString(record.street_name) ?? 'Unknown Street'}`;
		this.date = new Date(Date.parse(record.crash_date));
		this.category = normalizeString(record.prim_contributory_cause) ?? 'Unknown Category';
		this.subcategory = normalizeString(record.subcategory) ?? undefined;
		// Ensure distance is a number and handle undefined or null values
		this.distance = record.distance != null ? parseFloat(record.distance.toFixed(0)) : undefined;
		this.vehicles = parseVehicles(record.vehicles);
		this.non_passengers = parsePeople(record.non_passengers);
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

function parseVehicles(raw: IncidentRecord['vehicles']): Vehicle[] {
	if (!raw) return [];

	let vehicles: VehicleRecord[] = [];
	if (typeof raw === 'string') {
		try {
			vehicles = JSON.parse(raw) as VehicleRecord[];
		} catch (e) {
			console.warn('Failed to parse vehicles JSON', e);
			return [];
		}
	} else {
		vehicles = raw;
	}

	if (!Array.isArray(vehicles)) return [];
	return vehicles.map((v) => new Vehicle(v));
}

function parsePeople(raw: IncidentRecord['non_passengers']): Person[] {
	if (!raw) return [];

	let people: PersonRecord[] = [];
	if (typeof raw === 'string') {
		try {
			people = JSON.parse(raw) as PersonRecord[];
		} catch (e) {
			console.warn('Failed to parse non_passengers JSON', e);
			return [];
		}
	} else {
		people = raw;
	}

	if (!Array.isArray(people)) return [];
	return people.map((p) => new Person(p));
}
