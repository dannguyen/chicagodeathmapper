<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { ensureDatabase } from '$lib/appInit';
	import { getAllNeighborhoodStats, type NeighborhoodStat } from '$lib/db';
	import { appState } from '$lib/components/AppState.svelte';

	let stats: NeighborhoodStat[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Sorting state
	type SortField = 'name' | 'mostRecent' | 'avgPerYear' | 'totalIncidents';
	let sortField: SortField = $state('name');
	let sortDirection: 1 | -1 = $state(1); // 1 for asc, -1 for desc

	onMount(async () => {
		try {
			const db = await ensureDatabase();
			// This might take a moment, so we keep loading true
			// We could use a worker in a real heavy app, but main thread is likely fine for < 5000 incidents
			setTimeout(() => {
				if (db) {
					stats = getAllNeighborhoodStats(db);
					loading = false;
				}
			}, 10);
		} catch (e) {
			console.error(e);
			error = 'Failed to load neighborhood statistics.';
			loading = false;
		}
	});

	let sortedStats = $derived.by(() => {
		return [...stats].sort((a, b) => {
			let valA = a[sortField];
			let valB = b[sortField];

			// Handle nulls
			if (valA === null) valA = '';
			if (valB === null) valB = '';

			if (valA < valB) return -1 * sortDirection;
			if (valA > valB) return 1 * sortDirection;
			return 0;
		});
	});

	function toggleSort(field: SortField) {
		if (sortField === field) {
			sortDirection = (sortDirection * -1) as 1 | -1;
		} else {
			sortField = field;
			sortDirection = 1;
		}
	}
</script>

<div class="mx-auto max-w-7xl p-4">
	<h1 class="mb-6 text-3xl font-bold">Chicago Neighborhoods</h1>

	{#if loading}
		<div class="flex flex-col items-center justify-center p-12">
			<div
				class="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="text-xl text-gray-500">Calculating statistics...</p>
		</div>
	{:else if error}
		<div class="rounded-md bg-red-50 p-4">
			<p class="text-red-700">{error}</p>
		</div>
	{:else if stats.length === 0}
		<p class="text-gray-600">No neighborhoods found.</p>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
							onclick={() => toggleSort('name')}
						>
							<div class="flex items-center gap-2">
								Neighborhood
								<!-- <FontAwesomeIcon icon={getSortIcon('name')} class="text-gray-400 group-hover:text-gray-600" /> -->
								<span class="text-gray-400 group-hover:text-gray-600">
									{#if sortField === 'name'}
										{sortDirection === 1 ? '▲' : '▼'}
									{:else}
										↕
									{/if}
								</span>
							</div>
						</th>
						<th
							scope="col"
							class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
							onclick={() => toggleSort('mostRecent')}
						>
							<div class="flex items-center gap-2">
								Most Recent
								<span class="text-gray-400 group-hover:text-gray-600">
									{#if sortField === 'mostRecent'}
										{sortDirection === 1 ? '▲' : '▼'}
									{:else}
										↕
									{/if}
								</span>
							</div>
						</th>
						<th
							scope="col"
							class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
							onclick={() => toggleSort('avgPerYear')}
						>
							<div class="flex items-center gap-2">
								Avg Incidents/Year
								<span class="text-gray-400 group-hover:text-gray-600">
									{#if sortField === 'avgPerYear'}
										{sortDirection === 1 ? '▲' : '▼'}
									{:else}
										↕
									{/if}
								</span>
							</div>
						</th>
						<th
							scope="col"
							class="group cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
							onclick={() => toggleSort('totalIncidents')}
						>
							<div class="flex items-center gap-2">
								Total Incidents
								<span class="text-gray-400 group-hover:text-gray-600">
									{#if sortField === 'totalIncidents'}
										{sortDirection === 1 ? '▲' : '▼'}
									{:else}
										↕
									{/if}
								</span>
							</div>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each sortedStats as item (item.id)}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-6 py-4">
								<a
									href="{base}/neighborhoods/{item.id}"
									class="text-blue-600 hover:text-blue-900 font-medium"
								>
									{item.name}
								</a>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{item.mostRecent ?? 'N/A'}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{item.avgPerYear.toFixed(1)}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{item.totalIncidents}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
