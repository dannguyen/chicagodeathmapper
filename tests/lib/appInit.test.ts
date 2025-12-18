import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Inline mocks must come before importing the module under test.
// Use hoisted vi.mock factories that define spies inside.
const initSpy = vi.fn();
const ctorSpy = vi.fn();

vi.mock('$app/paths', () => ({
	assets: '/assets'
}));

vi.mock('$lib/db', async () => {
	const actual = await vi.importActual<typeof import('$lib/db')>('$lib/db');
	return {
		...actual,
		DatabaseConnection: vi.fn(function (this: any, url: string) {
			ctorSpy(url);
			this.url = url;
			this.db = null;
			this.init = initSpy.mockImplementation(async () => {
				this.db = { initialized: true };
			});
			return this;
		})
	};
});

import { ensureDatabase } from '$lib/appInit';
import { appState } from '$lib/components/AppState.svelte';

describe('ensureDatabase', () => {
	beforeEach(() => {
		appState.database = null as any;
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('creates and initializes a connection when none exists', async () => {
		const conn = await ensureDatabase();

		expect(ctorSpy).toHaveBeenCalledWith('/assets/database.sqlite');
		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(conn.db).toBeTruthy();
		expect(appState.database).toBe(conn);
	});

	it('returns existing connection without recreating', async () => {
		const existing = { db: { existing: true } } as any;
		appState.database = existing;

		const conn = await ensureDatabase();

		expect(conn).toBe(existing);
		expect(ctorSpy).not.toHaveBeenCalled();
		expect(initSpy).not.toHaveBeenCalled();
	});
});
