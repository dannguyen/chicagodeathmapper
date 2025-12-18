<script lang="ts">
	import SiteNav from '$lib/components/layout/SiteNav.svelte';
</script>

<footer class="main-footer">
	<SiteNav />
</footer>

<style lang="postcss">
	@reference "$lib/styles/app.css";

	.main-footer {
		@apply mt-8 pt-6 border-t border-gray-200 flex flex-col items-center gap-4;
	}

	:global(.navigation) {
		@apply mt-2;
	}
</style>
