import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	currentAgeInDays,
	currentAgePrettified,
	currentAgeSimplified,
	prettifyInteger
} from '$lib/transformHelpers';

describe('transformHelpers', () => {
	// Set a fixed "now" for testing date calculations
	// 2024-01-01 12:00:00 UTC
	const MOCKED_NOW = new Date('2024-01-01T12:00:00Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(MOCKED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('currentAgeInDays', () => {
		it('should return 0 for the same date', () => {
			const date = new Date('2024-01-01T12:00:00Z');
			expect(currentAgeInDays(date)).toBe(0);
		});

		it('should calculate days correctly for a past Date object', () => {
			// 10 days ago
			const date = new Date('2023-12-22T12:00:00Z');
			expect(currentAgeInDays(date)).toBe(10);
		});

		it('should calculate days correctly for a past string date', () => {
			// 2 days ago
			const dateStr = '2023-12-30T12:00:00Z';
			expect(currentAgeInDays(dateStr)).toBe(2);
		});

		it('should round down (floor) partial days', () => {
			// 1.5 days ago (should be 1)
			const date = new Date('2023-12-31T00:00:00Z');
			// Mocked now is Jan 1 12:00. Dec 31 00:00 is 36 hours ago = 1.5 days.
			expect(currentAgeInDays(date)).toBe(1);
		});
	});

	describe('currentAgePrettified', () => {
		it('should return "0d" for negative inputs', () => {
			expect(currentAgePrettified(-5)).toBe('0d');
		});

		it('should format days only correctly', () => {
			expect(currentAgePrettified(5)).toBe('5d');
			expect(currentAgePrettified(29)).toBe('29d');
		});

		it('should format months and days correctly', () => {
			// 45 days = 1m 15d
			expect(currentAgePrettified(45)).toBe('1m 15d');
			// 30 days = 1m
			expect(currentAgePrettified(30)).toBe('1m');
			// 31 days = 1m 1d
			expect(currentAgePrettified(31)).toBe('1m 1d');
		});

		it('should format years, months, and days correctly', () => {
			// 400 days:
			// 1 year (365)
			// remainder 35 days
			// 35 days = 1 month (30) + 5 days
			// Result: 1y 1m 5d
			expect(currentAgePrettified(400)).toBe('1y 1m 5d');
		});

		it('should accept a Date object', () => {
			// 45 days ago from 2024-01-01 is roughly mid-Nov 2023
			const date = new Date('2023-11-17T12:00:00Z');
			// 30 days in Nov + 17 = 47 days?
			// Let's use exact days: MOCKED_NOW - 45 days
			const pastDate = new Date(MOCKED_NOW.getTime() - 45 * 24 * 60 * 60 * 1000);
			expect(currentAgePrettified(pastDate)).toBe('1m 15d');
		});
	});

	describe('currentAgeSimplified', () => {
		it('should return "A day ago" for <= 1 day', () => {
			expect(currentAgeSimplified(0)).toBe('A day ago');
			expect(currentAgeSimplified(1)).toBe('A day ago');
		});

		it('should return days ago for 2-60 days', () => {
			expect(currentAgeSimplified(2)).toBe('2 ago');
			expect(currentAgeSimplified(59)).toBe('59 ago');
		});

		it('should return months ago for > 60 days', () => {
			// 61 days -> ~2 months
			expect(currentAgeSimplified(61)).toBe('2 months ago');
			// 100 days -> 3 months
			expect(currentAgeSimplified(100)).toBe('3 months ago');
		});

		it('should return years ago for > 2 years (730 days)', () => {
			// 731 days -> 2 years
			expect(currentAgeSimplified(731)).toBe('2 years ago');
			// 1200 days -> 3 years
			expect(currentAgeSimplified(1200)).toBe('3 years ago');
		});

		it('should accept a Date object', () => {
			const pastDate = new Date(MOCKED_NOW.getTime() - 100 * 24 * 60 * 60 * 1000);
			expect(currentAgeSimplified(pastDate)).toBe('3 months ago');
		});
	});

	describe('prettifyInteger', () => {
		it('should format integers with commas', () => {
			expect(prettifyInteger(100)).toBe('100');
			expect(prettifyInteger(1000)).toBe('1,000');
			expect(prettifyInteger(1000000)).toBe('1,000,000');
		});

		it('should handle 0', () => {
			expect(prettifyInteger(0)).toBe('0');
		});
	});
});
