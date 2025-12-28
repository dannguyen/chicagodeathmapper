<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Incident } from '$lib/incident';
	import { type Location } from '$lib/location';
	import { currentAgeSimplified, prettifyInteger } from '$lib/transformHelpers';

	let { incident, selectedLocation, distanceUnits } = $props<{
		incident: Incident | null;
		selectedLocation: Location | null;
		distanceUnits: string;
	}>();
</script>

<div id="incident-detail">
	<h3>{incident.title}</h3>
	<div class="incident-date" data-value={incident.date}>
		{incident.prettyDate}

		<em>
			({currentAgeSimplified(incident.date)})
		</em>
	</div>

	<div class="incident-category">
		{incident.category}
	</div>
	{#if selectedLocation.isPoint}
		<div class="incident-distance">
			{prettifyInteger(incident.distance as number)}
			{distanceUnits} away
		</div>
	{/if}

	{#if incident.vehicles}
		<ul class="incident-vehicles">
			{#each incident.vehicles as vh}
				<li class="vehicle">
					{vh.description}
					<ul class="vehicle-passengers">
						{#each vh.passengers as po}
							<li class="person">
								{po.description}

								{#if po.isInjured}
									suffered <span class="injury injury-{po.injury_level}">
										a {po.injury_level} injury
									</span>
								{:else if po.isUninjured}
									was <span class="injury injury-uninjured"> uninjured </span>
								{:else}
									suffered <span class="injury injury-unknown"> an unknown/unclear injury </span>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.meta-line {
		@apply flex gap-2;
	}

	#incident-detail {
		@apply w-full;
	}

	.incident-detail :global(b) {
		@apply text-gray-900;
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
