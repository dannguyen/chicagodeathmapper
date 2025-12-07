import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mapper } from '$lib/mapping';
import { Location } from '$lib/location';

// Mock `wellknown` dependency
vi.mock('wellknown', () => ({
	default: {
		parse: vi.fn(() => ({ type: 'Point', coordinates: [1, 2] }))
	}
}));

// Mock `leaflet` dependency
const mockLeaflet = {
	map: vi.fn().mockReturnThis(),
	setView: vi.fn().mockReturnThis(),
	tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn() }),
	marker: vi.fn().mockReturnValue({
		bindPopup: vi.fn().mockReturnValue({ openPopup: vi.fn() })
	}),
	circle: vi.fn().mockReturnValue({ addTo: vi.fn() }),
	geoJSON: vi.fn().mockReturnValue({ addTo: vi.fn() }),
	latLngBounds: vi.fn(),
	layerGroup: vi.fn().mockReturnValue({ addTo: vi.fn(), clearLayers: vi.fn() }),
	divIcon: vi.fn()
};

// Mock the dynamic import of `leaflet`
vi.mock('leaflet', () => ({
	default: mockLeaflet
}));

describe('Mapper', () => {
	let mapper: Mapper;

	beforeEach(() => {
		mapper = new Mapper();
		// Since we are mocking the dynamic import, we need to manually assign L for synchronous tests
		// OR simply call init() in an async beforeEach if we want to test the full flow.
		// For simplicity in unit testing methods like makeMapCircle, we can manually inject the mock:
		mapper.L = mockLeaflet;
		mapper.map = { remove: vi.fn() } as unknown as import('leaflet').Map;
	});

	it('should initialize the map correctly', async () => {
		// Reset mapper to test init explicitly
		mapper = new Mapper();

		const map = await mapper.init('map-id', [0, 0], 10);

		expect(mockLeaflet.map).toHaveBeenCalledWith('map-id');
		expect(mockLeaflet.map().setView).toHaveBeenCalledWith([0, 0], 10);
		expect(mockLeaflet.tileLayer).toHaveBeenCalled();
		expect(map).toBeDefined();
		expect(mapper.L).toBeDefined();
	});

	it('should destroy the map correctly', () => {
		const removeSpy = mapper.map!.remove;
		mapper.destroy();
		expect(removeSpy).toHaveBeenCalled();
		expect(mapper.map).toBeNull();
		expect(mapper.L).toBeNull();
	});
	it('should create a map circle', () => {
		const circle = mapper.makeMapCircle(-87, 41, 100);

		expect(mockLeaflet.circle).toHaveBeenCalledWith(
			[41, -87],
			expect.objectContaining({
				radius: 100,
				color: '#3c80ff'
			})
		);
		expect(circle).toBeDefined();
	});

	it('should create a point marker', () => {
		const location = new Location({
			id: '1',
			name: 'Test Location',
			latitude: 41,
			longitude: -87,
			category: 'intersection',
			the_geom: 'POINT(...)'
		});

		const marker = mapper.makePointMarker(location);

		expect(mockLeaflet.marker).toHaveBeenCalledWith([41, -87]);
		expect(marker.bindPopup).toHaveBeenCalledWith('Test Location');
	});

	it('should create a shape marker', () => {
		const location = new Location({
			id: '2',
			name: 'Test Shape',
			latitude: 41,
			longitude: -87,
			category: 'community_area',
			the_geom: 'POLYGON(...)'
		});

		const marker = mapper.makeShapeMarker(location);

		expect(mockLeaflet.geoJSON).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'FeatureCollection',
				features: expect.arrayContaining([
					expect.objectContaining({
						properties: expect.objectContaining({
							name: 'Test Shape'
						})
					})
				])
			}),
			expect.any(Object)
		);
		expect(marker).toBeDefined();
	});
});
