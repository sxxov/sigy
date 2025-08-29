import { describe, it, expect } from 'vitest';
import { some } from './some';

describe(some, () => {
	it('returns false for undefined or null', () => {
		expect(some(undefined)).toBe(false);
		expect(some(null)).toBe(false);
	});

	it('returns true for other falsy/primitive values', () => {
		expect(some(0)).toBe(true);
		expect(some(false)).toBe(true);
		expect(some('')).toBe(true);
		expect(some(NaN)).toBe(true);
	});
});
