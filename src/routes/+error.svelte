<script>
	import { page } from '$app/state';
</script>

<div class="error-container">
	<h1 class="error-code">{page.status}</h1>
	<h2 class="error-title">
		{page.status === 404 ? 'Page not found' : page.error?.message || 'Something went wrong'}
	</h2>
	<p class="error-message">
		{#if page.status === 404}
			The page you're looking for doesn't exist or has been moved.
		{:else}
			We encountered an unexpected error. Please try again later.
		{/if}
	</p>
	<a href="/" class="home-button">Back to Home</a>
</div>
