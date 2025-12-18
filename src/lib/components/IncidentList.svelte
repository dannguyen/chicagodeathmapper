<script lang="ts">
	import { currentAgeSimplified, prettifyInteger } from '$lib/transformHelpers';
	import { Incident } from '$lib/incident';
	import type { Location } from '$lib/location';

	let { incidents, selectedLocation, distanceUnits, showIncidentOnMap } = $props<{
		incidents: Incident[];
		selectedLocation: Location | null;
		distanceUnits: string;
		showIncidentOnMap: (index: number) => void;
	}>();

	function markerIconHtml(index: number) {
		const label = index + 1;
		return `<div class="marker-icon">${label}</div>`;
	}
</script>

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
						{item.prettyDate}

						<em>
							({currentAgeSimplified(item.date)})
						</em>
					</div>
					<div class="incident-category">
						{item.category}
					</div>
					{#if selectedLocation.isPoint}
						<div class="incident-distance">
							{prettifyInteger(item.distance as number)}
							{distanceUnits} away
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</section>
{/if}

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.incident-record {
		@apply border border-gray-400 mb-2 p-4 rounded-md hover:bg-yellow-100;
	}

	.incident-record-header {
		@apply flex flex-col gap-4 md:flex-row;
	}

	.incident-record .incident-record-header .title {
		@apply w-full md:w-3/4;
	}

	:global(.marker-icon) {
		@apply flex items-center justify-center w-6 h-6 bg-purple-700 text-white font-bold rounded-full border-2 border-white shadow-md;
	}

	.clickable-row {
		@apply cursor-pointer hover:bg-gray-50;
	}

	.incident-record-details {
		@apply text-sm text-gray-600;
	}

	.incident-record-details em {
		@apply italic text-gray-500;
	}

	.incident-date {
		@apply mb-1;
	}

	.incident-category {
		@apply mb-1;
	}

	.incident-distance {
		@apply text-purple-700 font-semibold;
	}
</style>
