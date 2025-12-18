<script lang="ts">
	import { onMount } from 'svelte';
	import { assets, base } from '$app/paths';
	import {
		DatabaseConnection,
		getTopIntersectionsByIncidentCount,
		getTopIntersectionsByRecentIncidents,
		type IntersectionStat
	} from '$lib/db';
	import { appState } from '$lib/components/AppState.svelte';

	let topByCount: IntersectionStat[] = $state([]);
	let topByRecency: IntersectionStat[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			let db = appState.database;
			if (!db) {
				const databasePath = `${assets}/database.sqlite`;
				db = new DatabaseConnection(databasePath);
				await db.init();
				appState.database = db;
			}

			// Run calculations
			// Use setTimeout to allow UI to render loading state before heavy JS loop
			setTimeout(() => {
				if (db) {
					topByCount = getTopIntersectionsByIncidentCount(db);
					topByRecency = getTopIntersectionsByRecentIncidents(db);
					loading = false;
				}
			}, 50);
		} catch (e) {
			console.error(e);
			error = 'Failed to load intersection statistics.';
			loading = false;
		}
	});
</script>

<div class="page-container">
	<h1 class="page-title">Top Intersections</h1>

	{#if loading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p class="loading-text">Analyzing intersection data...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<p class="error-text">{error}</p>
		</div>
	{:else}
		<div class="lists-grid">
			<!-- Most Incidents List -->
			<div class="list-card">
				<div class="card-header">
					<h2 class="card-title">Most Incidents (within 500ft)</h2>
				</div>
				<ul class="stats-list">
					{#each topByCount as item, i}
						<li class="list-item">
							<div class="item-content">
								<div class="item-main">
									<span class="rank-badge">{i + 1}</span>
									<a href="{base}/intersections/{item.id}" class="location-link">
										{item.name}
									</a>
								</div>
								<span class="count-badge">
									{item.count} incidents
								</span>
							</div>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Most Recent List -->
			<div class="list-card">
				<div class="card-header">
					<h2 class="card-title">Most Recent Incidents</h2>
				</div>
				<ul class="stats-list">
					{#each topByRecency as item, i}
						<li class="list-item">
							<div class="item-content">
								<div class="item-main">
									<span class="rank-badge">{i + 1}</span>
									<div class="location-details">
										<a href="{base}/intersections/{item.id}" class="location-link">
											{item.name}
										</a>
										<span class="detail-subtext">
											Approx. {item.distance} ft from incident
										</span>
									</div>
								</div>
								<span class="date-text">
									{item.mostRecentDate}
								</span>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.page-container {
		@apply mx-auto max-w-7xl p-4;
	}

	.page-title {
		@apply mb-6 text-3xl font-bold;
	}

	.loading-container {
		@apply flex flex-col items-center justify-center p-12;
	}

	.spinner {
		@apply mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent;
	}

	.loading-text {
		@apply text-xl text-gray-500;
	}

	.error-container {
		@apply rounded-md bg-red-50 p-4;
	}

	.error-text {
		@apply text-red-700;
	}

	.lists-grid {
		@apply grid grid-cols-1 gap-8 md:grid-cols-2;
	}

	.list-card {
		@apply overflow-hidden rounded-lg border border-gray-200 shadow-sm;
	}

	.card-header {
		@apply bg-gray-50 px-6 py-4 border-b border-gray-200;
	}

	.card-title {
		@apply text-lg font-semibold text-gray-800;
	}

	.stats-list {
		@apply divide-y divide-gray-200 bg-white;
	}

	.list-item {
		@apply p-4 hover:bg-gray-50;
	}

	.item-content {
		@apply flex flex-col items-start gap-2;
	}

	.item-main {
		@apply flex items-center gap-3;
	}

	.rank-badge {
		@apply flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600;
	}

	.location-link {
		@apply font-medium text-blue-600 hover:text-blue-800;
	}

	.count-badge {
		@apply rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800;
	}

	.location-details {
		@apply flex flex-col;
	}

	.detail-subtext {
		@apply text-xs text-gray-500;
	}

	.date-text {
		@apply text-sm font-medium text-gray-600;
	}
</style>
