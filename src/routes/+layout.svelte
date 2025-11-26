<script lang="ts">
	import '../app.css';
	import '$lib/vendor/fontawesome.js';
	import { dev } from '$app/environment';

	let envClass = dev ? 'env-dev' : 'env-prod';
</script>

<main class="main-container {envClass}">
	<slot />
</main>

<style lang="postcss">
	@reference "../app.css";

	.main-container {
		@apply min-h-screen bg-gray-100 p-4 md:p-8 font-sans;
	}

	.main-container.env-dev {
		@apply bg-yellow-300;
	}
</style>
