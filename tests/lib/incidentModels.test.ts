import { describe, it, expect } from 'vitest';
import { Person, Vehicle, type PersonRecord, type VehicleRecord, Incident } from '$lib/incident';

describe('Person', () => {
	it('builds with provided fields', () => {
		const record: PersonRecord = {
			person_id: 'P1',
			person_type: 'DRIVER',
			sex: 'F',
			age: '30',
			city: 'Chicago',
			state: 'IL',
			injury_classification: 'FATAL'
		};

		const person = new Person(record);

		expect(person.person_id).toBe('P1');
		expect(person.person_type).toBe('DRIVER');
		expect(person.sex).toBe('F');
		expect(person.age).toBe(30);
		expect(person.city).toBe('Chicago');
		expect(person.state).toBe('IL');
		expect(person.injury).toBe('FATAL');
	});

	it('handles missing fields gracefully', () => {
		const person = new Person();
		expect(person.person_id).toBeNull();
		expect(person.city).toBeNull();
	});

	it('derives noun by sex/age and builds description', () => {
		const baby = new Person({ sex: 'M', age: '0' });
		expect(baby.noun).toBe('boy');
		expect(baby.description).toBe('baby boy');

		const man = new Person({ sex: 'M', age: '30' });
		expect(man.noun).toBe('man');
		expect(man.description).toBe('30-year-old man');

		const girl = new Person({ sex: 'F', age: '15' });
		expect(girl.noun).toBe('girl');
		expect(girl.description).toBe('15-year-old girl');

		const neutral = new Person({ sex: 'X', age: '20' });
		expect(neutral.noun).toBe('person');
		expect(neutral.description).toBe('20-year-old person');
	});
});

describe('Vehicle', () => {
	it('maps passengers into Person instances', () => {
		const record: VehicleRecord = {
			vehicle_id: 'V1',
			unit_type: 'DRIVER',
			make: 'Ford',
			model: 'F-150',
			vehicle_year: '2020',
			vehicle_defect: 'NONE',
			vehicle_type: 'TRUCK',
			vehicle_use: 'PERSONAL',
			passengers: [
				{ person_id: 'P1', person_type: 'DRIVER', injury_classification: 'NONE' },
				{
					person_id: 'P2',
					person_type: 'PASSENGER',
					injury_classification: 'INCAPACITATING INJURY'
				}
			]
		};

		const vehicle = new Vehicle(record);

		expect(vehicle.vehicle_id).toBe('V1');
		expect(vehicle.make).toBe('Ford');
		expect(vehicle.passengers).toHaveLength(2);
		expect(vehicle.passengers[0]).toBeInstanceOf(Person);
		expect(vehicle.passengers[0].person_id).toBe('P1');
		expect(vehicle.passengers[1].injury).toBe('INCAPACITATING INJURY');
	});

	it('defaults passengers to empty array when not provided', () => {
		const vehicle = new Vehicle({ vehicle_id: 'V2' });
		expect(vehicle.passengers).toEqual([]);
	});

	it('normalizes blank strings to null', () => {
		const vehicle = new Vehicle({
			vehicle_id: '',
			make: ' ',
			model: '',
			passengers: [{ person_id: '', city: '  ' }]
		});

		expect(vehicle.vehicle_id).toBeNull();
		expect(vehicle.make).toBeNull();
		expect(vehicle.model).toBeNull();
		expect(vehicle.passengers[0].person_id).toBeNull();
		expect(vehicle.passengers[0].city).toBeNull();
	});

	it('builds description from year/make/model', () => {
		const vehicle = new Vehicle({ vehicle_year: '2020', make: 'Toyota', model: 'Camry' });
		expect(vehicle.description).toBe('2020 Toyota Camry');

		const partial = new Vehicle({ make: 'Ford' });
		expect(partial.description).toBe('Ford');
	});
});

describe('Incident vehicles and non_passengers parsing', () => {
	it('parses JSON string vehicles/non_passengers into instances', () => {
		const incident = new Incident({
			longitude: -87.7,
			latitude: 41.9,
			injuries_fatal: 0,
			injuries_incapacitating: 1,
			crash_date: '2024-01-01',
			vehicles: '[{"vehicle_id":"V1","passengers":[{"person_id":"P1"}]}]',
			non_passengers: '[{"person_id":"NP1"}]'
		});

		expect(incident.vehicles).toHaveLength(1);
		expect(incident.vehicles[0]).toBeInstanceOf(Vehicle);
		expect(incident.vehicles[0].passengers[0]).toBeInstanceOf(Person);
		expect(incident.non_passengers).toHaveLength(1);
		expect(incident.non_passengers[0]).toBeInstanceOf(Person);
	});

	it('handles array inputs and bad JSON safely', () => {
		// array input
		const incidentFromArrays = new Incident({
			longitude: 0,
			latitude: 0,
			injuries_fatal: 0,
			injuries_incapacitating: 0,
			crash_date: '2024-01-02',
			vehicles: [{ vehicle_id: 'V2', passengers: [{ person_id: 'P2' }] }],
			non_passengers: [{ person_id: 'NP2' }]
		});
		expect(incidentFromArrays.vehicles[0].vehicle_id).toBe('V2');
		expect(incidentFromArrays.non_passengers[0].person_id).toBe('NP2');

		// bad JSON should not throw
		const incidentBadJson = new Incident({
			longitude: 0,
			latitude: 0,
			injuries_fatal: 0,
			injuries_incapacitating: 0,
			crash_date: '2024-01-03',
			vehicles: 'not-json',
			non_passengers: 'also-bad'
		});
		expect(incidentBadJson.vehicles).toEqual([]);
		expect(incidentBadJson.non_passengers).toEqual([]);
	});
});
