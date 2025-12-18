<script lang="ts">
	import '$lib/styles/app.css';
	import '$lib/vendor/fontawesome.js';
	import { dev } from '$app/environment';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';

	let envClass = dev ? 'env-dev' : 'env-prod';
</script>

<main class="main-container {envClass}">
	<div class="container">
		<SiteHeader />
		<slot />
		<SiteFooter />
	</div>
</main>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.main-container {
		@apply min-h-screen bg-gray-100 p-4 md:p-8 font-sans;
	}

	.main-container.env-dev {
		@apply bg-yellow-300;
	}

	.container {
		@apply max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6;
	}
</style>
