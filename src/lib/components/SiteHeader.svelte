<script lang="ts">
	import { resolve } from '$app/paths';
	import LocationSearch from '$lib/components/LocationSearch.svelte';
	import { appState } from '$lib/components/AppState.svelte';
	import type { Location } from '$lib/location';

	function onLocationSelectGlobal(location: Location) {
		appState.selectedLocation = location;
	}
</script>

<header class="main-header">
	<h1 class="site-title">
		<a href={resolve('/')}> Chicago Death Mapper </a>
	</h1>
	<div class="search-wrapper">
		<LocationSearch database={appState.database} onSelect={onLocationSelectGlobal} />
	</div>
</header>

<style lang="postcss">
	@reference "../../app.css";

	.main-header {
		@apply mb-6 flex flex-col items-center gap-4;
	}

	.site-title {
		@apply text-3xl font-bold text-gray-800 text-center mb-4;
	}

	.search-wrapper {
		@apply w-full max-w-sm md:w-1/3 md:mr-auto;
	}
</style>
