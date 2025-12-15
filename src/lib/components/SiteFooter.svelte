<script lang="ts">
	import { resolve } from '$app/paths';
	import LocationSearch from '$lib/components/LocationSearch.svelte';
	import { appState } from '$lib/components/AppState.svelte';
	import type { Location } from '$lib/location';
	import { assets, base } from '$app/paths';

	function onLocationSelectGlobal(location: Location) {
		appState.selectedLocation = location;
	}
</script>

<footer class="main-footer">
	<div class="search-wrapper">
		<LocationSearch database={appState.database} onSelect={onLocationSelectGlobal} />
	</div>
	<div class="navigation-items">
		<ul>
			<li class="nav-link">
				<a href="{base}/">Homepage</a>
			</li>
			<li class="nav-link">
				<a href="{base}/neighborhoods"> Neighborhoods </a>
			</li>
			<li class="nav-link">
				<a href="{base}/intersections"> Intersections </a>
			</li>
		</ul>
	</div>
</footer>

<style lang="postcss">
	@reference "../../app.css";

	.main-footer {
		@apply mt-8 pt-6 border-t border-gray-200 flex flex-col items-center gap-4;
	}

	.search-wrapper {
		@apply w-full max-w-sm md:w-1/3 md:mr-auto;
	}

	.navigation-items {
		@apply w-full max-w-sm md:w-1/3 md:mr-auto mt-2;
	}

	.navigation-items ul {
		@apply flex flex-col gap-2;
	}

	li.nav-link {
		@apply text-blue-600;
	}

	.nav-link a {
		@apply hover:text-purple-600 font-medium transition-colors;
	}
</style>
