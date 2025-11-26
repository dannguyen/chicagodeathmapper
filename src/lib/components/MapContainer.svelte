<script lang="ts">
	import { onMount } from 'svelte';
	import wellknown from 'wellknown';
	import { Incident } from '$lib/incident';
	import { Location } from '$lib/location';

	let { selectedLocation, incidents, setIncidentDetail, defaultGeoCenter } = $props<{
		selectedLocation: Location | null;
		incidents: Incident[];
		setIncidentDetail: (item: Incident | null) => void;
		defaultGeoCenter: [number, number];
	}>();

	let map: any;
	let activeMarker: any = null;
	let markerLayerGroup: any;
	let L: any;

	function markerIconHtml(index: number) {
		const label = index + 1;
		return `<div class="marker-icon">${label}</div>`;
	}

	async function initMap() {
		L = (await import('leaflet')).default;

		// Chicago center coordinates
		map = L.map('map').setView(defaultGeoCenter, 11);
		markerLayerGroup = L.layerGroup().addTo(map);

		// Use OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);
	}

	function makePointMarker(location: Location) {
		const mk = L.marker([location.latitude, location.longitude]);
		mk.bindPopup(location.name).openPopup();
		return mk;
	}

	function makeShapeMarker(location: Location) {
		const geometry = wellknown.parse(location.the_geom);
		console.log(`its a ${location.category}`);
		console.log(geometry);
		const features = [
			{
				type: 'Feature',
				geometry,
				properties: {
					id: location.id,
					name: location.name,
					category: location.category
				}
			}
		];

		const mk = L.geoJSON(
			{
				type: 'FeatureCollection',
				features
			},
			{
				style: () => ({
					weight: 1,
					color: '#4455bb',
					fillOpacity: 0.4
				}),
				onEachFeature: (feature: Record<string, unknown>, layer: any) => {
					const p = feature.properties as Record<string, unknown>;
					if (p?.name) {
						layer.bindPopup(p.name);
					}
				}
			}
		);

		return mk;
	}

	function clearActiveLayer() {
		if (activeMarker) {
			map.removeLayer(activeMarker);
			activeMarker = null;
		}
	}

	export function updateMapWithLocation(location: Location) {
		if (!map) return;

		clearActiveLayer();
		map.setView([location.latitude, location.longitude], 16);

		if (location.isShape) {
			activeMarker = makeShapeMarker(location);
		} else {
			activeMarker = makePointMarker(location);
		}
		activeMarker.addTo(map);
	}

	export function updateNearbyMarkers(items: Incident[]) {
		if (!map || !L || !markerLayerGroup) return;

		markerLayerGroup.clearLayers();
		// incidentMarkers = []; // This needs to be managed externally if IncidentMap uses it

		items.forEach((item, index) => {
			const lat = item.latitude;
			const lon = item.longitude;

			if (!isNaN(lat) && !isNaN(lon)) {
				const popupHtml = item.title;
				const incidentMarker = L.marker([lat, lon]).bindPopup(popupHtml);

				incidentMarker.on('click', () => setIncidentDetail(item));

				incidentMarker.addTo(markerLayerGroup);
				// incidentMarkers[index] = incidentMarker; // This needs to be managed externally
			}
		});
	}

	$effect(() => {
		if (selectedLocation) {
			updateMapWithLocation(selectedLocation);
		}
		if (incidents.length > 0) {
			updateNearbyMarkers(incidents);
		}
	});

	onMount(async () => {
		await initMap();
	});
</script>

<div id="map"></div>

<style lang="postcss">
	@reference "../../app.css";

	/* Leaflet requires a height to be set explicitly if not using Tailwind classes or if they don't propagate */
	:global(#map) {
		height: 400px;
		z-index: 0; /* Ensure map stays below autocomplete */
		@apply h-96 w-full rounded-md border border-gray-300 mb-4 z-0;
	}
</style>
