<script lang="ts">
	import IncidentMap from '$lib/components/IncidentMap.svelte';
	import { dev } from '$app/environment';

	let envClass = dev ? 'env-dev' : 'env-prod';
</script>

<main class="main-container {envClass}">
	<IncidentMap />
</main>

<style lang="postcss">
	@reference "../app.css";
	.main-container {
		@apply min-h-screen bg-purple-100 p-4 md:p-8 font-sans;
	}

	.main-container.env-dev {
		@apply bg-yellow-300;
	}
</style>
