<script lang="ts">
	import { currentAgeSimplified, prettifyInteger } from '$lib/transformHelpers';
	import { Incident, Vehicle } from '$lib/incident';
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

					{#if item.vehicles}
						<ul class="incident-vehicles">
							{#each item.vehicles as vh}
								<li class="vehicle">
									{vh.description}
									<ul class="vehicle-passengers">
										{#each vh.passengers as po}
											<li class="person">
												{po.description}

												{#if po.isInjured}
													had <span class="injury injury-{po.injury_level}">
														a {po.injury_level} injury
													</span>
												{/if}
											</li>
										{/each}
									</ul>
								</li>
							{/each}
						</ul>
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

	.incident-vehicles {
		@apply pl-4 list-disc text-gray-700 mt-2;
	}

	.incident-vehicles .vehicle {
		@apply mb-1;
	}

	.injury-fatal {
		@apply ml-1 text-red-700;
	}

	.injury-incapacitating {
		@apply ml-1 text-orange-700;
	}

	.vehicle-passengers {
		@apply pl-6 list-disc text-gray-600 mt-1;
	}

	.vehicle-passengers .person .injury {
		@apply font-semibold;
	}
</style>
