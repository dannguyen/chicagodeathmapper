<script lang="ts">
	import { base } from '$app/paths';
	import LocationSearch from '$lib/components/LocationSearch.svelte';
	import { appState } from '$lib/components/AppState.svelte';
	import type { Location } from '$lib/location';

	function onLocationSelectGlobal(location: Location) {
		appState.selectedLocation = location;
	}
</script>

<nav class="navigation">
	<div class="search-label">Search for crashes by intersection, neighborhood, ward, etc</div>
	<div class="search-wrapper">
		<LocationSearch database={appState.database} onSelect={onLocationSelectGlobal} />
	</div>
	<ul class="navigation-items">
		<li class="nav-link">
			<a href="{base}/">Homepage</a>
		</li>
		<li class="nav-link">
			<a href="{base}/neighborhoods">Neighborhoods</a>
		</li>
		<li class="nav-link">
			<a href="{base}/intersections">Intersections</a>
		</li>
	</ul>
</nav>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.navigation {
		@apply w-full;
	}

	.search-label {
		@apply text-sm text-gray-600 text-center;
	}

	.search-wrapper {
		@apply w-full max-w-sm md:w-1/3 mx-auto mb-2;
	}

	.navigation-items {
		@apply flex flex-row flex-wrap justify-center gap-4;
	}

	li.nav-link {
		@apply text-blue-600;
	}

	.nav-link a {
		@apply hover:text-purple-600 font-medium transition-colors;
	}
</style>
