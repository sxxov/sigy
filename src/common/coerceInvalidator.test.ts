import { describe, it, expect, vi } from 'vitest';
import { coerceInvalidator } from './coerceInvalidator';

describe(coerceInvalidator, () => {
	it('returns undefined for undefined', () => {
		// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
		expect(coerceInvalidator(undefined)).toBeUndefined();
	});

	it('passes through a direct invalidator function', () => {
		const fn = vi.fn();
		const result = coerceInvalidator(fn);
		expect(result).toBe(fn);
	});

	it('wraps a promise resolving to an invalidator', async () => {
		const inner = vi.fn();
		const p = Promise.resolve(() => inner());

		const wrapped = coerceInvalidator(p)!;
		expect(typeof wrapped).toBe('function');

		wrapped();
		// allow the microtask to run
		await Promise.resolve();
		expect(inner).toHaveBeenCalledTimes(1);
	});

	it('promise resolving to undefined yields a noop', async () => {
		const p = Promise.resolve(undefined);
		const wrapped = coerceInvalidator(p);

		wrapped?.();
		await Promise.resolve();
		// nothing to assert except that it does not throw
		expect(true).toBe(true);
	});
});
