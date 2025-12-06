<script lang="ts">
	import { resolve } from '$app/paths';
	import '../app.css';
	import '$lib/vendor/fontawesome.js';
	import { dev } from '$app/environment';

	let envClass = dev ? 'env-dev' : 'env-prod';
</script>

<main class="main-container {envClass}">
	<div class="container">
		<h1>
			<a href={resolve('/')}> Chicago Death Mapper </a>
		</h1>
		<slot />
	</div>
</main>

<style lang="postcss">
	@reference "../app.css";

	.main-container {
		@apply min-h-screen bg-gray-100 p-4 md:p-8 font-sans;
	}

	.main-container.env-dev {
		@apply bg-yellow-300;
	}

	h1 {
		@apply text-3xl font-bold text-center text-gray-800 mb-6;
	}

	.container {
		@apply max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6;
	}
</style>
