<script lang="ts">
	import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';

	import { highlightFilteredText } from '$lib/inputHelpers';
	import { type Location } from '$lib/location';
	import { queryLocationsByName, type DatabaseConnection } from '$lib/db';

	let {
		database,
		onSelect,
		locationName = ''
	} = $props<{
		database: DatabaseConnection;
		onSelect: (loc: Location) => void;
		locationName?: string;
	}>();

	let inputValue = $state<string>(locationName);
	let searchQuery = $state<string>('');
	let showAutocomplete = $state<boolean>(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	let locationResults = $state<Location[]>([]);

	$effect(() => {
		if (searchQuery.trim().length >= 2 && database.db) {
			locationResults = queryLocationsByName(database, searchQuery);
		} else {
			locationResults = [];
		}
	});

	function handleInput() {
		showAutocomplete = true;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			searchQuery = inputValue;
		}, 300);
	}

	function handleInputBlur() {
		// Small delay to allow click event on results to register
		setTimeout(() => {
			showAutocomplete = false;
		}, 200);
	}

	function handleInputFocus() {
		if (inputValue.trim()) {
			showAutocomplete = true;
		}
	}

	function handleInputClick() {
		inputValue = '';
		searchQuery = '';
		showAutocomplete = false;
		clearTimeout(debounceTimer);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && locationResults.length > 0) {
			selectLocation(locationResults[0]);
			showAutocomplete = false; // Hide autocomplete after selection
			event.preventDefault(); // Prevent form submission if input is part of a form
		}
	}

	function selectLocation(location: Location) {
		inputValue = location.name;
		searchQuery = location.name;
		showAutocomplete = false;
		onSelect(location);
		if (location.id) {
			// TODO: use location.category instead of hardcoded intersection
			goto(resolve(`/intersection/${location.id}`));
		}
	}
</script>

<div class="search-container">
	<input
		type="text"
		bind:value={inputValue}
		onfocus={handleInputFocus}
		onblur={handleInputBlur}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onclick={handleInputClick}
		placeholder={locationName || 'Enter location name...'}
		id="search-input-field"
		autocomplete="off"
	/>

	{#if showAutocomplete && locationResults.length > 0}
		<div class="location-results-list">
			{#each locationResults as result}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="location-item" onclick={() => selectLocation(result)}>
					{@html highlightFilteredText(result.name, searchQuery)}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "../../app.css";

	.location-results-list {
		@apply absolute w-full max-h-72 overflow-y-auto bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg z-[1001];
	}

	.location-results-list .location-item {
		@apply p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-0;
	}

	#search-input-field {
		@apply w-full p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
	}

	.search-container {
		@apply relative z-[1000] flex-1;
	}
</style>
