import { test, expect } from '@playwright/test';

test('location page initializes map layers on first visit', async ({ page }) => {
	await page.goto('/neighborhoods');

	const firstLocationLink = page.locator('table tbody tr a').first();
	await expect(firstLocationLink).toBeVisible();
	await firstLocationLink.click();

	await page.waitForURL(/\/neighborhoods\/.+/);
	await expect(page.locator('#map.leaflet-container')).toBeVisible();

	const overlayPath = page
		.locator('#map .leaflet-overlay-pane svg path.leaflet-interactive')
		.first();
	await expect(overlayPath).toBeVisible();
});
