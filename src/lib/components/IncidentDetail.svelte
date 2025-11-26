<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Incident } from '$lib/incident';

	let { selectedIncident } = $props<{
		selectedIncident: Incident | null;
	}>();

	function formatIncidentDetail(item: Incident, style: string = '') {
		if (style === 'brief') {
			return `${item.title}`;
		} else {
			return `<b>${item.title}</b><br>Distance: ${item.distance} feet<br>Date: ${item.date}`;
		}
	}
</script>

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

<style lang="postcss">
	@reference "../../app.css";

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
