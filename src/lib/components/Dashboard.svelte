<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { assets } from '$app/paths';

	import { appState } from '$lib/components/AppState.svelte';
	import { prettifyDate } from '$lib/transformHelpers';

	import { reifyIncidents } from '$lib/incident';
	import type { Location } from '$lib/location'; // Use type import since Location is not instantiated directly

	import {
		queryIncidentsMostRecentNearLocation,
		queryIncidentsInsideLocation,
		queryLocationById,
		DatabaseConnection // Keep for type, but not instantiated locally
	} from '$lib/db';
	import type { Incident } from '$lib/incident';
	import IncidentList from '$lib/components/IncidentList.svelte';
	import MapContainer from '$lib/components/MapContainer.svelte';

	let { initialLocationId = null } = $props<{
		initialLocationId?: string | null;
	}>();

	const defaultGeoCenter: [number, number] = [41.8781, -87.6298];
	const searchDelayMs = 700;
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastSearchedLocation: Location | null = null;

	function setIncidentDetail(item: Incident | null) {
		appState.selectedIncident = item;
	}

	function findIncidentsByLocation(location: Location) {
		if (!appState.database) return;
		lastSearchedLocation = location;

		let results;
		if (location.isShape) {
			results = queryIncidentsInsideLocation(
				appState.database,
				location,
				appState.maxDaysAgo,
				appState.selectedDate
			);
		} else {
			results = queryIncidentsMostRecentNearLocation(
				appState.database,
				location,
				appState.maxDistance,
				appState.maxDaysAgo,
				appState.selectedDate
			);
		}
		appState.incidents = reifyIncidents(results);
		appState.selectedIncident = null; // Clear selected incident when new search occurs
	}

	function onLocationSelect(location: Location) {
		appState.selectedLocation = location;
		findIncidentsByLocation(location);
	}

	function scheduleIncidentSearch() {
		if (!appState.selectedLocation) return;
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		searchTimeout = setTimeout(() => {
			if (appState.selectedLocation) {
				findIncidentsByLocation(appState.selectedLocation);
			}
		}, searchDelayMs);
	}

	function handleMaxDistanceChange(event: Event) {
		const value = parseFloat((event.target as HTMLInputElement).value);
		if (!isNaN(value) && value >= 1) {
			appState.maxDistance = value;
			scheduleIncidentSearch();
		}
	}

	function handleMaxDaysAgoChange(event: Event) {
		const value = parseInt((event.target as HTMLInputElement).value, 10);
		if (!isNaN(value) && value >= 1) {
			appState.maxDaysAgo = value;
			scheduleIncidentSearch();
		}
	}

	function handleSelectedDateChange(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		if (value) {
			appState.selectedDate = new Date(value);
			scheduleIncidentSearch();
		}
	}

	function formatDateInput(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function showIncidentOnMap(index: number) {
		// This function now just sets the selected incident,
		// MapContainer will react to `selectedIncident` changes.
		setIncidentDetail(appState.incidents[index]);
	}

	$effect(() => {
		const loc = appState.selectedLocation;
		// Only do an immediate fetch when the selected location itself changes
		if (loc && loc !== lastSearchedLocation) {
			lastSearchedLocation = loc;
			findIncidentsByLocation(loc);
		} else if (!loc) {
			lastSearchedLocation = null;
		}
	});

	onMount(async () => {
		if (appState.database?.db) {
			if (initialLocationId) {
				const loc = queryLocationById(appState.database, initialLocationId);
				if (loc) {
					onLocationSelect(loc);
				}
			} else {
				// Reset state if no location is specified (e.g. home page)
				appState.selectedLocation = null;
				appState.incidents = [];
				appState.selectedIncident = null;
			}
		}
	});
</script>

<!-- Result Container -->
<div class="block" id="main-results-section">
	<section id="query-result-meta-section">
		{#key `${appState.selectedLocation?.name ?? 'none'}-${appState.incidents.length}`}
			<div class="meta-wrapper" out:slide={{ duration: 300 }}>
				<div class="search-results-for-selected-location">
					<div class="selected-location-info">
						{#if appState.selectedLocation}
							<div class="meta-line">
								<span class="meta-label">Location:</span>
								<span class="location-name">{appState.selectedLocation.name}</span>
								<span class="location-coordinates">
									({appState.selectedLocation.longitude},
									{appState.selectedLocation.latitude})
								</span>
							</div>
							<div class="search-results-summary">
								<div class="search-attr">
									{appState.incidents.length}
								</div>
								incidents found within

								{#if appState.selectedLocation.isPoint}
									<div class="search-attr">
										<input
											id="inline-max-distance-input"
											class="inline-input number-input"
											type="number"
											min="1"
											value={appState.maxDistance}
											oninput={handleMaxDistanceChange}
										/>
										{appState.distanceUnits}
									</div>
								{:else}
									the boundaries of
									<div class="search-attr">
										{appState.selectedLocation.name}
									</div>
								{/if}
								and
								<div class="search-attr">
									<input
										id="inline-max-days-ago-input"
										class="inline-input number-input"
										type="number"
										min="1"
										value={appState.maxDaysAgo}
										oninput={handleMaxDaysAgoChange}
									/>
									days from
								</div>
								<input
									id="inline-selected-date-input"
									class="inline-input date-input"
									type="date"
									value={formatDateInput(appState.selectedDate)}
									oninput={handleSelectedDateChange}
								/>
							</div>
						{:else}
							<div class="meta-line">
								<span class="meta-label">No location selected.</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/key}
	</section>

	<div class="details-container">
		<section id="map-section">
			<MapContainer
				selectedLocation={appState.selectedLocation}
				incidents={appState.incidents}
				{setIncidentDetail}
				{defaultGeoCenter}
				maxDistance={appState.maxDistance}
			/>
		</section>
	</div>

	<section id="incidents-list-section">
		<IncidentList
			incidents={appState.incidents}
			selectedLocation={appState.selectedLocation}
			distanceUnits={appState.distanceUnits}
			{showIncidentOnMap}
		/>
	</section>
</div>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.search-results-summary {
		@apply py-3;
	}
	.search-attr {
		display: inline;
		font-weight: bold;
	}

	.inline-input {
		display: inline-block;
		padding: 0.2rem 0.35rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-weight: 600;
		margin: 0 0.25rem;
	}

	.inline-input.number-input {
		width: 5.5rem;
	}

	.inline-input.date-input {
		width: 12rem;
	}

	#main-results-section {
		@apply mb-4 p-4;
	}
</style>
