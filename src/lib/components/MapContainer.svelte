<script lang="ts">
	import { onMount } from 'svelte';
	import { Mapper } from '$lib/mapping'; // Import the class, not an instance
	import { Incident } from '$lib/incident';
	import { Location } from '$lib/location';

	let {
		selectedLocation,
		incidents,
		setIncidentDetail,
		defaultGeoCenter,
		maxDistance = 5280
	} = $props<{
		selectedLocation: Location | null;
		incidents: Incident[];
		setIncidentDetail: (item: Incident | null) => void;
		defaultGeoCenter: [number, number];
		maxDistance?: number;
	}>();

	// Create a local instance of Mapper
	const MapperInstance = new Mapper();

	let activeMarker: any = null;
	let mapCircleLayer: any = null;
	let markerLayerGroup: any;

	function markerIconHtml(index: number) {
		const label = index + 1;
		return `<div class="marker-icon">${label}</div>`;
	}

	async function initMap() {
		await MapperInstance.init('map', defaultGeoCenter, 11);

		if (MapperInstance.L && MapperInstance.map) {
			markerLayerGroup = MapperInstance.L.layerGroup().addTo(MapperInstance.map);
		}
	}

	function clearActiveLayer() {
		if (activeMarker && MapperInstance.map) {
			MapperInstance.map.removeLayer(activeMarker);
			activeMarker = null;
		}
	}

	function updateSearchRadius() {
		if (mapCircleLayer && MapperInstance.map) {
			MapperInstance.map.removeLayer(mapCircleLayer);
			mapCircleLayer = null;
		}

		if (selectedLocation && MapperInstance.map && MapperInstance.L) {
			// Convert feet to meters (1 ft = 0.3048 m)
			const radiusInMeters = maxDistance * 0.3048;
			mapCircleLayer = MapperInstance.makeMapCircle(
				selectedLocation.longitude,
				selectedLocation.latitude,
				radiusInMeters
			);

			if (mapCircleLayer) {
				mapCircleLayer.addTo(MapperInstance.map);
			}
		}
	}

	export function updateMapWithLocation(location: Location) {
		if (!MapperInstance.map) return;

		clearActiveLayer();
		MapperInstance.map.setView([location.latitude, location.longitude], 16);

		if (location.isShape) {
			activeMarker = MapperInstance.makeShapeMarker(location);
		} else {
			activeMarker = MapperInstance.makePointMarker(location);
			updateSearchRadius();
		}
		if (activeMarker) {
			activeMarker.addTo(MapperInstance.map);
		}
	}

	export function updateNearbyMarkers(items: Incident[]) {
		if (!MapperInstance.map || !MapperInstance.L || !markerLayerGroup) return;

		markerLayerGroup.clearLayers();
		// incidentMarkers = []; // This needs to be managed externally if Dashboard uses it

		items.forEach((item, index) => {
			const lat = item.latitude;
			const lon = item.longitude;

			if (!isNaN(lat) && !isNaN(lon)) {
				const popupHtml = item.title;
				const icon = MapperInstance.L.divIcon({
					html: markerIconHtml(index),
					className: '',
					iconSize: [24, 24],
					iconAnchor: [12, 12]
				});
				const incidentMarker = MapperInstance.L.marker([lat, lon], { icon }).bindPopup(popupHtml);

				incidentMarker.on('click', () => setIncidentDetail(item));

				incidentMarker.addTo(markerLayerGroup);
				// incidentMarkers[index] = incidentMarker; // This needs to be managed externally
			}
		});

		fitToIncidents(items);
	}

	export function fitToIncidents(items: Incident[]) {
		if (!MapperInstance.map || !MapperInstance.L) return;

		if (items.length > 0) {
			const latLngs: L.LatLngExpression[] = items.map((item) => [item.latitude, item.longitude]);
			if (selectedLocation) {
				latLngs.push([selectedLocation.latitude, selectedLocation.longitude]);
			}
			const bounds = MapperInstance.L.latLngBounds(latLngs);
			MapperInstance.map.fitBounds(bounds, { padding: [50, 50] });
			MapperInstance.map.invalidateSize();
		} else if (selectedLocation) {
			MapperInstance.map.setView([selectedLocation.latitude, selectedLocation.longitude], 16);
			MapperInstance.map.invalidateSize();
		}
	}

	function syncMapState() {
		if (!MapperInstance.map) return;
		if (selectedLocation) {
			updateMapWithLocation(selectedLocation);
		} else {
			clearActiveLayer();
		}
		if (incidents.length > 0) {
			updateNearbyMarkers(incidents);
		} else if (markerLayerGroup) {
			markerLayerGroup.clearLayers();
		}
	}

	// React to location changes only
	$effect(() => {
		const loc = selectedLocation;
		if (!MapperInstance.map) return;
		if (loc) {
			updateMapWithLocation(loc);
		} else {
			clearActiveLayer();
			if (mapCircleLayer && MapperInstance.map) {
				MapperInstance.map.removeLayer(mapCircleLayer);
				mapCircleLayer = null;
			}
		}
	});

	// React to distance filter changes without recentering
	$effect(() => {
		if (selectedLocation?.isPoint && maxDistance) {
			updateSearchRadius();
		} else if (mapCircleLayer && MapperInstance.map) {
			MapperInstance.map.removeLayer(mapCircleLayer);
			mapCircleLayer = null;
		}
	});

	// React to incident result changes
	$effect(() => {
		if (incidents.length > 0) {
			updateNearbyMarkers(incidents);
		} else if (markerLayerGroup) {
			markerLayerGroup.clearLayers();
			fitToIncidents([]);
		}
	});

	onMount(() => {
		let destroyed = false;
		(async () => {
			await initMap();
			if (destroyed) return;
			syncMapState();
			requestAnimationFrame(() => {
				MapperInstance.map?.invalidateSize();
			});
		})();

		// Return cleanup function for Svelte to run when unmounting
		return () => {
			destroyed = true;
			MapperInstance.destroy();
		};
	});
</script>

<div id="map"></div>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	/* Leaflet requires a height to be set explicitly if not using Tailwind classes or if they don't propagate */
	:global(#map) {
		height: 400px;
		z-index: 0; /* Ensure map stays below autocomplete */
		@apply h-96 w-full rounded-md border border-gray-300 mb-4 z-0;
	}
</style>
