<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	const location = $derived(data.location);
</script>

<h1 class="page-headline">
	<a href="{base}/{location.pluralCategory}">
		{location.pluralCategory}
	</a>
	/ {location.name}
</h1>

<Dashboard initialLocationId={location.id} />

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.page-headline {
		@apply mb-6 text-2xl font-bold text-gray-800;
	}

	.page-headline a {
		@apply text-blue-600 hover:text-blue-800;
	}
</style>
