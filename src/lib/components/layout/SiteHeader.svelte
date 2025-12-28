<script lang="ts">
	import { resolve } from '$app/paths';
	import SiteNav from '$lib/components/layout/SiteNav.svelte';
</script>

<header class="main-header">
	<h1 class="site-title">
		<a href={resolve('/')}> Chicago Crash Mapper </a>
	</h1>
	<SiteNav />
</header>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.main-header {
		@apply mb-6 flex flex-col items-center gap-4;
	}

	.site-title {
		@apply text-3xl font-bold text-gray-800 text-center mb-4;
	}
</style>
