<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { assets } from '$app/paths';

	import { appState } from '$lib/components/AppState.svelte';

	import { reifyIncidents } from '$lib/incident';
	import type { Location } from '$lib/location'; // Use type import since Location is not instantiated directly

	import {
		queryIncidentsNearestToLocation,
		queryIncidentsInsideLocation,
		queryLocationById,
		DatabaseConnection // Keep for type, but not instantiated locally
	} from '$lib/db';
	import type { Incident } from '$lib/incident';
	import IncidentList from '$lib/components/IncidentList.svelte';
	import IncidentDetail from '$lib/components/IncidentDetail.svelte';
	import MapContainer from '$lib/components/MapContainer.svelte';

	let { initialLocationId = null } = $props<{
		initialLocationId?: string | null;
	}>();

	const defaultGeoCenter: [number, number] = [41.8781, -87.6298];

	function setIncidentDetail(item: Incident | null) {
		appState.selectedIncident = item;
	}

	function findIncidentsByLocation(location: Location) {
		if (!appState.database) return;

		let results;
		if (location.isShape) {
			results = queryIncidentsInsideLocation(appState.database, location);
		} else {
			results = queryIncidentsNearestToLocation(appState.database, location, appState.maxDistance);
		}
		appState.incidents = reifyIncidents(results);
		appState.selectedIncident = null; // Clear selected incident when new search occurs
	}

	function onLocationSelect(location: Location) {
		appState.selectedLocation = location;
		findIncidentsByLocation(location);
	}

	function handleMaxDistanceChange(event: Event) {
		const value = parseFloat((event.target as HTMLInputElement).value);
		if (!isNaN(value) && value >= 1) {
			appState.maxDistance = value;
			if (appState.selectedLocation) {
				findIncidentsByLocation(appState.selectedLocation);
			}
		}
	}

	function showIncidentOnMap(index: number) {
		// This function now just sets the selected incident,
		// MapContainer will react to `selectedIncident` changes.
		setIncidentDetail(appState.incidents[index]);
	}

	$effect(() => {
		// Whenever selectedLocation or maxDistance changes, refetch incidents
		if (appState.selectedLocation) {
			findIncidentsByLocation(appState.selectedLocation);
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
				<div class="selected-location">
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
							<div class="meta-line">
								<span class="meta-label">Incidents:</span>
								{appState.incidents.length}
								within
								{#if appState.selectedLocation.isPoint}
									{appState.maxDistance} {appState.distanceUnits}
								{:else}
									{appState.selectedLocation.name}
								{/if}
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

		<IncidentDetail selectedIncident={appState.selectedIncident} />
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
	@reference "../../app.css";
</style>
