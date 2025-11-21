<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		escapeRegExp,
		highlightText,
		filterIntersections,
		type Intersection
	} from '$lib/searchUtils';
	import { initDb, registerGeospatialFunctions, type DatabaseConnection } from '$lib/dbUtils';

	interface Incident {
		longitude: number;
		latitude: number;
		title: string;
		date: string;
		category: string;
		subcategory: string;
		distance: number;
	}

	let searchQuery = $state<string>('');
	let inputValue = $state<string>('');
	let intersections: Intersection[] = [];
	let incidents: Incident[] = $state([]);
	let dataLoaded = $state<boolean>(false);
	let selectedIntersection = $state<Intersection | null>(null);
	let map: any;
	let marker: any;
	let nearbyLayerGroup: any;
	let L: any;
	let database: DatabaseConnection = { db: null };
	let showAutocomplete = $state<boolean>(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	const intersectionsFilePath: string = resolve('/chicago-intersections.json');
	const databaseFilePath: string = resolve('/database.sqlite');

	function enumerateIncidents(items: any[]) {
		let returnItems: Incident[] = [];
		items.forEach((item) => {
			let i = {
				longitude: item.longitude,
				latitude: item.latitude,
				title: `${item.injuries_fatal} fatalities on ${item.street_no} ${item.street_direction} ${item.street_name}`,
				category: item.prim_contributory_cause,
				distance: item.distance.toFixed(0),
				date: item.crash_date
			};
			returnItems.push(i);
		});

		return returnItems;
	}

	function findNearby(intersection: Intersection) {
		if (!database.db) return;
		const iLat = intersection.latitude;
		const iLon = intersection.longitude;

		// Query for 5 closest records
		const stmt = database.db.prepare(`
          SELECT *, HAVERSINE_DISTANCE(latitude, longitude, :lat, :lon) as distance
          FROM incidents
          ORDER BY distance ASC
          LIMIT 20
          ;
      `);

		stmt.bind({ ':lat': iLat, ':lon': iLon });

		const results = [];
		while (stmt.step()) {
			const row = stmt.getAsObject();
			results.push(row);
		}
		stmt.free();

		incidents = enumerateIncidents(results);
		console.log(`incident 0 of ${incidents.length}: ${JSON.stringify(incidents[0])}`);

		updateNearbyMarkers(incidents);

		let mappoints: Array = [[iLat, iLon]];
		results.forEach((r) => {
			mappoints.push([r.latitude, r.longitude]);
		});
		map.fitBounds(mappoints, { padding: [50, 20], maxZoom: 15 });
	}

	function handleInput() {
		showAutocomplete = true;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			searchQuery = inputValue;
		}, 300);
	}

	function handleInputBlur() {
		// Small delay to allow click event on results to register
		setTimeout(() => {
			showAutocomplete = false;
		}, 200);
	}

	function handleInputFocus() {
		if (inputValue.trim()) {
			showAutocomplete = true;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && intersectionResults.length > 0) {
			selectIntersection(intersectionResults[0]);
			showAutocomplete = false; // Hide autocomplete after selection
			event.preventDefault(); // Prevent form submission if input is part of a form
		}
	}

	async function initDatabase() {
		database.db = await initDb(databaseFilePath);
		if (database.db) {
			registerGeospatialFunctions(database.db);
		}
	}

	async function initMap() {
		L = (await import('leaflet')).default;

		// Chicago center coordinates
		const chicagoCenter: [number, number] = [41.8781, -87.6298];
		map = L.map('map').setView(chicagoCenter, 11);
		nearbyLayerGroup = L.layerGroup().addTo(map);

		// Use OpenStreetMap
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);
	}

	function selectIntersection(intersection: Intersection) {
		selectedIntersection = intersection;
		inputValue = intersection.intersection;
		searchQuery = intersection.intersection;
		showAutocomplete = false;

		// Update map
		if (map) {
			map.setView([intersection.latitude, intersection.longitude], 17);

			if (marker) {
				marker.setLatLng([intersection.latitude, intersection.longitude]);
			} else {
				marker = L.marker([intersection.latitude, intersection.longitude]).addTo(map);
			}

			marker.bindPopup(intersection.intersection).openPopup();

			// Find nearby records from the SQLite database
			findNearby(intersection);
		}
	}

	function updateNearbyMarkers(items: Incident[]) {
		if (!map || !L || !nearbyLayerGroup) return;

		nearbyLayerGroup.clearLayers();

		items.forEach((item, index) => {
			const lat = item.latitude;
			const lon = item.longitude;

			if (!isNaN(lat) && !isNaN(lon)) {
				// Limit to 9 markers (1-9)
				const markerHtml = `<div class="flex items-center justify-center w-6 h-6 bg-purple-700 text-white font-bold rounded-full border-2 border-white shadow-md">${index + 1}</div>`;
				const customIcon = L.divIcon({
					html: markerHtml,
					className: '',
					iconSize: [24, 24],
					iconAnchor: [12, 12],
					popupAnchor: [0, -12] // Adjust popup position
				});

				L.marker([lat, lon], { icon: customIcon })
					.bindPopup(
						`<b>${item.title}</b><br>Distance: ${item.distance} feet<br>Date: ${item.date}`
					)
					.addTo(nearbyLayerGroup);
			}
		});
	}

	// Fetch data on mount
	onMount(async () => {
		await initMap();
		await initDatabase();

		try {
			const response = await fetch(intersectionsFilePath);
			intersections = await response.json();
			dataLoaded = true;
		} catch (error) {
			console.error('Error loading intersections data:', error);
		}
	});

	let intersectionResults = $derived.by(() => {
		if (!dataLoaded) return [];
		return filterIntersections(intersections, searchQuery);
	});
</script>

<main class="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
	<div class="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
		<h1 class="text-3xl font-bold text-center text-gray-800 mb-6">
			Chicago Vehicle Crash Finder
			<i class="fa-regular fa-thumbs-up"></i>
		</h1>

		<!-- Search Container -->
		<div class="relative mb-6 z-[1000]">
			<input
				type="text"
				bind:value={inputValue}
				onfocus={handleInputFocus}
				onblur={handleInputBlur}
				oninput={handleInput}
				onkeydown={handleKeydown}
				placeholder="Enter intersection name..."
				class="w-full p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				autocomplete="off"
			/>

			{#if showAutocomplete && intersectionResults.length > 0}
				<div
					class="absolute w-full max-h-72 overflow-y-auto bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg z-[1001]"
				>
					{#each intersectionResults as result}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-0"
							onclick={() => selectIntersection(result)}
						>
							{@html highlightText(result.intersection, searchQuery)}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Result Container -->
		<div class="block">
			<div id="map" class="h-96 w-full rounded-md border border-gray-300 mb-4 z-0"></div>

			{#if selectedIntersection}
				<div class="bg-gray-50 p-4 border border-gray-200 rounded-md">
					<div class="font-mono text-sm text-gray-700">
						<div>{selectedIntersection.intersection}</div>

						<div>
							Latitude: <span class="text-blue-600 font-bold"
								>{selectedIntersection.latitude.toFixed(5)}</span
							>
						</div>
						<div>
							Longitude: <span class="text-blue-600 font-bold"
								>{selectedIntersection.longitude.toFixed(5)}</span
							>
						</div>
					</div>
				</div>
			{/if}

			{#if incidents.length > 0}
				<table>
					<thead>
						<tr>
							<th>Incident</th>
							<th>Date</th>
							<th>Category</th>
							<th>Distance</th>
						</tr>
					</thead>
					<tbody>
						{#each incidents as item, index}
							<tr>
								<td>{index + 1}. {item.title}</td>
								<td>{item.date}</td>
								<td>{item.category}</td>
								<td>{item.distance}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</main>

<style>
	@reference "../app.css";

	/* Leaflet requires a height to be set explicitly if not using Tailwind classes or if they don't propagate */
	:global(#map) {
		height: 400px;
		z-index: 0; /* Ensure map stays below autocomplete */
	}
</style>
