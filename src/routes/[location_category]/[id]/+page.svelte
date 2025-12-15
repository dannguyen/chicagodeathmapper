<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let location = data.location;
</script>

<h1 class="mb-6 text-2xl font-bold text-gray-800">
	<a href="{base}/{location.pluralCategory}" class="text-blue-600 hover:text-blue-800">
		{location.pluralCategory}
	</a>
	/ {location.name}
</h1>

<Dashboard initialLocationId={location.id} />
