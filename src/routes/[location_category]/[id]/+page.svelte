<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import { page } from '$app/stores';

	let id = $derived($page.params.id);
	let category: string = 'intersection';
</script>

<Dashboard initialLocationId={id} />
