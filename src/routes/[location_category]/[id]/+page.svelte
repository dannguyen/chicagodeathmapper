<script lang="ts">
	import IncidentMap from '$lib/components/IncidentMap.svelte';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);
	let category: string = 'intersection';
</script>

<IncidentMap initialLocationId={id} initialLocationCategory={category} />
