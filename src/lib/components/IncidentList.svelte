<script lang="ts">
	import { currentAgeSimplified, prettifyInteger } from '$lib/transformHelpers';
	import { Incident, Vehicle } from '$lib/incident';
	import IncidentDetail from '$lib/components/IncidentDetail.svelte';

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
				<div class="marker">{@html markerIconHtml(index)}</div>

				<IncidentDetail incident={item} {selectedLocation} {distanceUnits} />
			</div>
		{/each}
	</section>
{/if}

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.incident-record {
		@apply border border-gray-400 mb-2 p-4 rounded-md hover:bg-yellow-100;
	}

	:global(.marker-icon) {
		@apply flex items-center justify-center w-6 h-6 bg-purple-700 text-white font-bold rounded-full border-2 border-white shadow-md;
	}

	.clickable-row {
		@apply cursor-pointer hover:bg-gray-50;
	}
</style>
