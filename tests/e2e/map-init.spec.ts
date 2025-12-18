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

test('deep link initializes database and map', async ({ page, context }) => {
	await page.goto('/neighborhoods');
	const firstLocationLink = page.locator('table tbody tr a').first();
	const href = await firstLocationLink.getAttribute('href');
	expect(href).toBeTruthy();

	const newPage = await context.newPage();
	await newPage.goto(href as string);

	await expect(newPage.locator('#map.leaflet-container')).toBeVisible();
	await expect(newPage.getByText(/Database not initialized/i)).toHaveCount(0);
});
