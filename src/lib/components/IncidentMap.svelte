<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { assets } from '$app/paths';

	import { reifyIncidents, Incident } from '$lib/incident';
	import { Location } from '$lib/location';

	import {
		queryIncidentsNearestToLocation,
		queryIncidentsInsideLocation,
		queryLocationById,
		DatabaseConnection
	} from '$lib/db';
	import LocationSearch from '$lib/components/LocationSearch.svelte';
	import IncidentList from '$lib/components/IncidentList.svelte';
	import IncidentDetail from '$lib/components/IncidentDetail.svelte';
	import MapContainer from '$lib/components/MapContainer.svelte';

	let { initialLocationId = null, initialLocationCategory = 'Location' } = $props<{
		initialLocationId?: string | null;
		initialLocationCategory?: string | null;
	}>();

	const databasePath: string = `${assets}/database.sqlite`;
	let database: DatabaseConnection = new DatabaseConnection(databasePath);
	let databaseSummary: { type: string; count: number | null }[] = $state([
		{ type: 'Loading the database...', count: null }
	]);

	const defaultGeoCenter: [number, number] = [41.8781, -87.6298];
	let incidents: Incident[] = $state([]);
	let selectedLocation = $state<Location | null>(null);
	let maxDistance = $state<number>(5280);
	let distanceUnits = 'feet';
	let selectedIncident = $state<Incident | null>(null);

	function setIncidentDetail(item: Incident | null) {
		selectedIncident = item;
	}

	function findNearbyIncidents(location: Location) {
		let results: Incident[];
		if (location.isShape) {
			results = queryIncidentsInsideLocation(database, location);
		} else {
			results = queryIncidentsNearestToLocation(database, location);
		}
		incidents = reifyIncidents(results);
		setIncidentDetail(null); // Clear selected incident when new search occurs
	}

	function onLocationSelect(location: Location) {
		selectedLocation = location;
		findNearbyIncidents(location);
	}

	function handleMaxDistanceChange() {
		if (selectedLocation) {
			findNearbyIncidents(selectedLocation);
		}
	}

	function showIncidentOnMap(index: number) {
		// This function now just sets the selected incident,
		// MapContainer will react to `selectedIncident` changes.
		setIncidentDetail(incidents[index]);
	}

	$effect(() => {
		// Whenever selectedLocation or maxDistance changes, refetch incidents
		if (selectedLocation) {
			findNearbyIncidents(selectedLocation);
		}
	});

	onMount(async () => {
		await database.init();
		if (database.db) {
			databaseSummary = database.getDatabaseSummary();

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
	});
</script>

<div class="input-row">
	<!-- Search Container -->
	<LocationSearch {database} onSelect={onLocationSelect} locationName={selectedLocation?.name} />

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
								within
								{#if selectedLocation.isPoint}
									{maxDistance} {distanceUnits}
								{:else}
									{selectedLocation.name}
								{/if}
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
			<MapContainer
				{selectedLocation}
				{incidents}
				{setIncidentDetail}
				{defaultGeoCenter}
				{maxDistance}
			/>
		</section>

		<IncidentDetail {selectedIncident} />
	</div>

	<section id="incidents-list-section">
		<IncidentList {incidents} {distanceUnits} {showIncidentOnMap} />
	</section>
</div>

<style lang="postcss">
	@reference "../../app.css";

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

	.meta-line {
		@apply flex gap-2 items-baseline;
	}

	.meta-label {
		@apply font-semibold text-gray-800;
	}

	.meta-wrapper {
		@apply overflow-hidden;
	}

	.details-container {
		@apply flex flex-col gap-4 md:flex-row;
	}

	#map-section {
		@apply w-full md:w-3/4;
	}
</style>
