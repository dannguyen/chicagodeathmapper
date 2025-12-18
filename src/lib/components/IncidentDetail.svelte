<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Incident } from '$lib/incident';
	import { type Location } from '$lib/location';

	let { selectedIncident, selectedLocation } = $props<{
		selectedIncident: Incident | null;
		selectedLocation: Location | null;
	}>();
</script>

<section id="selected-incident-detail-section">
	<div class="selected-location">
		<div class="selected-location-info">
			{#if selectedIncident}
				<div class="selected-incident-detail" transition:slide={{ duration: 250 }}>
					<h3>{selectedIncident.title}</h3>
					{#if selectedLocation.isPoint}
						<div>
							{selectedIncident.distance} feet
						</div>
					{/if}
					<div>
						{selectedIncident.prettyDate}
					</div>
				</div>
			{:else}
				<div class="meta-line">Click an incident to view details here.</div>
			{/if}
		</div>
	</div>
</section>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.selected-location {
		@apply bg-gray-50 p-4 border border-gray-200 rounded-md;
	}

	.selected-location-info {
		@apply font-mono text-sm text-gray-700;
	}

	.meta-line {
		@apply flex gap-2 items-baseline;
	}

	#selected-incident-detail-section {
		@apply w-full md:w-1/4;
	}

	.selected-incident-detail :global(b) {
		@apply text-gray-900;
	}
</style>
