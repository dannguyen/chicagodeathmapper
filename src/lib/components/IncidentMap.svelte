<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { resolve } from '$app/paths';

	import { enumerateIncidents, type Incident } from '$lib/incident';

	import type { Location } from '$lib/location';

	import { queryNearestToLocation, queryLocationById, DatabaseConnection } from '$lib/db';
	import LocationSearch from '$lib/components/LocationSearch.svelte';

	let { initialLocationId = null, initialLocationCategory = 'Location' } = $props<{
		initialLocationId?: string | null;
		initialLocationCategory?: string | null;
	}>();

	const databasePath: string = resolve('/database.sqlite');
	let database: DatabaseConnection = new DatabaseConnection(databasePath);
	let databaseSummary = $state([{ type: 'Loading the database...', count: null }]);
	const defaultGeoCenter: [number, number] = [41.8781, -87.6298];
	let incidents: Incident[] = $state([]);
	let selectedLocation = $state<Location | null>(null);
	let maxDistance = $state<number>(5280);
	let distanceUnits = 'feet';
	let distanceDebounceTimer: ReturnType<typeof setTimeout>;
	let selectedIncident = $state<Incident | null>(null);

	let map: any;
	let marker: any;
	let markerLayerGroup: any;
	let incidentMarkers: any[] = [];
	let L: any;

	function markerIconHtml(index: number) {
		const label = index + 1;
		return `<div class="marker-icon">${label}</div>`;
	}

	function formatIncidentDetail(item: Incident, style: string = '') {
		if (style === 'brief') {
			return `${item.title}`;
		} else {
			return `<b>${item.title}</b><br>Distance: ${item.distance} feet<br>Date: ${item.date}`;
		}
	}

	function setIncidentDetail(item: Incident | null) {
		selectedIncident = item;
	}

	function findNearbyIncidents(location: Location) {
		let results: Array = queryNearestToLocation(database, location, maxDistance);

		incidents = enumerateIncidents(results);
		setIncidentDetail(null);
		console.log(`incident 0 of ${incidents.length}: ${JSON.stringify(incidents[0])}`);

		updateNearbyMarkers(incidents);

		// now fit the map to include the points and the location
		let mappoints: Array = [[location.latitude, location.longitude]];
		results.forEach((r) => {
			mappoints.push([r.latitude, r.longitude]);
		});
		map.fitBounds(mappoints, { padding: [50, 20], maxZoom: 15 });
	}

	function handleMaxDistanceChange() {
		clearTimeout(distanceDebounceTimer);

		distanceDebounceTimer = setTimeout(() => {
			if (selectedLocation) {
				findNearbyIncidents(selectedLocation);
			}
		}, 700);
	}

	async function initDatabase() {
		await database.init();
		if (database.db) {
			databaseSummary = database.summary;

			if (initialLocationId) {
				const loc = queryLocationById(database, initialLocationId);
				if (loc) {
					onLocationSelect(loc);
				} else {
					databaseSummary = [
						{
							count: null,
							type: `${initialLocationCategory} with ID ${initialLocationId} not found.`
						}
					];
				}
			}
		}
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

	function onLocationSelect(location: Location) {
		selectedLocation = location;

		// Update map
		if (map) {
			map.setView([location.latitude, location.longitude], 17);

			if (marker) {
				marker.setLatLng([location.latitude, location.longitude]);
			} else {
				marker = L.marker([location.latitude, location.longitude]).addTo(map);
			}

			marker.bindPopup(location.name).openPopup();

			findNearbyIncidents(location);
		}
	}

	function updateNearbyMarkers(items: Incident[]) {
		if (!map || !L || !markerLayerGroup) return;

		markerLayerGroup.clearLayers();
		incidentMarkers = [];

		items.forEach((item, index) => {
			const lat = item.latitude;
			const lon = item.longitude;

			if (!isNaN(lat) && !isNaN(lon)) {
				const markerHtml = markerIconHtml(index);
				const popupHtml = formatIncidentDetail(item, 'brief');
				const customIcon = L.divIcon({
					html: markerHtml,
					className: '',
					iconSize: [24, 24],
					iconAnchor: [12, 12],
					popupAnchor: [0, -12] // Adjust popup position
				});

				const incidentMarker = L.marker([lat, lon], { icon: customIcon }).bindPopup(popupHtml);

				incidentMarker.on('click', () => setIncidentDetail(item));

				incidentMarker.addTo(markerLayerGroup);
				incidentMarkers[index] = incidentMarker;
			}
		});
	}

	function showIncidentOnMap(index: number) {
		const marker = incidentMarkers[index];
		if (!marker || !map) return;

		setIncidentDetail(incidents[index]);
		marker.openPopup();
		map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15));
	}

	// Fetch data on mount
	onMount(async () => {
		await initMap();
		await initDatabase();
	});
</script>

<main class="main-container">
	<div class="container">
		<h1>
			<a href={resolve('/')}> Chicago Death Mapper </a>
		</h1>

		<div class="input-row">
			<!-- Search Container -->
			<LocationSearch
				{database}
				onSelect={onLocationSelect}
				locationName={selectedLocation?.name}
			/>

			<!-- Max Distance Input -->
			<div class="max-distance-container">
				<label for="maxDistance" class="block text-sm font-medium text-gray-700"
					>Max Distance (feet):</label
				>
				<input
					type="number"
					id="maxDistance"
					bind:value={maxDistance}
					min="1"
					oninput={handleMaxDistanceChange}
					class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>
		</div>

		<!-- Result Container -->
		<div class="block" id="main-results-section">
			<section id="query-result-meta-section">
				{#key `${selectedLocation?.name ?? 'none'}-${incidents.length}`}
					<div class="meta-wrapper" out:slide={{ duration: 300 }}>
						<div class="selected-location">
							<div class="selected-location-info">
								{#if selectedLocation}
									<div class="meta-line">
										<span class="meta-label">Location:</span>
										<span class="location-name">{selectedLocation.name}</span>
										<span class="location-coordinates">
											({selectedLocation.longitude},
											{selectedLocation.latitude})
										</span>
									</div>
									<div class="meta-line">
										<span class="meta-label">Incidents:</span>
										{incidents.length}
										within {maxDistance}
										{distanceUnits}
									</div>
								{:else if databaseSummary.length > 0}
									<div class="database-summary">
										{#each databaseSummary as item}
											<div class="meta-line" transition:slide={{ duration: 900 }}>
												{item.count}
												<span class="meta-label">{item.type}</span>
											</div>
										{/each}
									</div>
								{:else}{/if}
							</div>
						</div>
					</div>
				{/key}
			</section>

			<div class="details-container">
				<section id="map-section">
					<div id="map"></div>
				</section>

				<section id="selected-incident-detail-section">
					<div class="selected-location">
						<div class="selected-location-info">
							{#if selectedIncident}
								<div class="selected-incident-detail" transition:slide={{ duration: 250 }}>
									{@html formatIncidentDetail(selectedIncident)}
								</div>
							{:else}
								<div class="meta-line">Click an incident to view details here.</div>
							{/if}
						</div>
					</div>
				</section>
			</div>

			<section id="incidents-list-section">
				{#if incidents.length > 0}
					<section class="incidents-list">
						{#each incidents as item, index}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div onclick={() => showIncidentOnMap(index)} class="incident-record clickable-row">
								<div class="incident-record-header">
									<div class="marker">{@html markerIconHtml(index)}</div>
									<div class="title">{item.title}</div>
								</div>
								<div class="incident-record-details">
									<div class="incident-date" data-value={item.date}>
										{item.date.toDateString()}
									</div>
									<div class="incident-category">
										{item.category}
									</div>
									<div class="incident-distance">
										{item.distance}
										{distanceUnits} away
									</div>
								</div>
							</div>
						{/each}
					</section>
				{/if}
			</section>
		</div>
	</div>
</main>

<style>
	@reference "../../app.css";

	/* Leaflet requires a height to be set explicitly if not using Tailwind classes or if they don't propagate */
	:global(#map) {
		height: 400px;
		z-index: 0; /* Ensure map stays below autocomplete */
		@apply h-96 w-full rounded-md border border-gray-300 mb-4 z-0;
	}

	h1 {
		@apply text-3xl font-bold text-center text-gray-800 mb-6;
	}

	.incidents-list {
	}
	.main-container {
		@apply min-h-screen bg-gray-100 p-4 md:p-8 font-sans;
	}

	.container {
		@apply max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6;
	}

	.input-row {
		@apply flex flex-col gap-4 md:flex-row md:items-end mb-6;
	}

	.selected-location {
		@apply bg-gray-50 p-4 border border-gray-200 rounded-md;
	}

	.selected-location-info {
		@apply font-mono text-sm text-gray-700;
	}

	.max-distance-container {
		@apply w-full md:w-56;
	}

	:global(.marker-icon) {
		@apply flex items-center justify-center w-6 h-6 bg-purple-700 text-white font-bold rounded-full border-2 border-white shadow-md;
	}

	.clickable-row {
		@apply cursor-pointer hover:bg-gray-50;
	}

	.details-container {
		@apply flex flex-col gap-4 md:flex-row;
	}

	#map-section {
		@apply w-full md:w-3/4;
	}

	#query-result-meta-section {
		@apply mb-4;
	}

	.meta-line {
		@apply flex gap-2 items-baseline;
	}

	.meta-label {
		@apply font-semibold text-gray-800;
	}

	.meta-wrapper {
		@apply overflow-hidden;
	}

	#selected-incident-detail-section {
		@apply w-full md:w-1/4;
	}

	.selected-incident-detail :global(b) {
		@apply text-gray-900;
	}

	.incident-record {
		@apply border border-gray-400 mb-2 p-4 rounded-md hover:bg-yellow-100;
	}

	.incident-record-header {
		@apply flex flex-col gap-4 md:flex-row;
	}

	.incident-record .incident-record-header .title {
		@apply w-full md:w-3/4;
	}
</style>
