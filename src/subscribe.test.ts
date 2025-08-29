import { describe, it, expect, vi } from 'vitest';
import { Signal } from './Signal';
import { subscribe } from './subscribe';

describe(subscribe, () => {
	it('calls callback with $-prefixed values initially & on change', () => {
		const a = new Signal(1);
		const b = new Signal('x');

		const seen: { $a: number; $b: string }[] = [];
		const unsubscribe = subscribe({ a, b }, (values) => {
			// values should have $-prefixed keys
			seen.push({ $a: values.$a, $b: values.$b });
		});

		expect(seen[0]).toEqual({ $a: 1, $b: 'x' });

		a.set(2);
		b.set('y');

		// expect subsequent entries present
		expect(seen.some((v) => v.$a === 2 && v.$b === 'x')).toBe(true);
		expect(seen.some((v) => v.$a === 2 && v.$b === 'y')).toBe(true);

		unsubscribe();
	});

	it('runs invalidator before next callback & on unsubscribe', () => {
		const s = new Signal(0);
		const calls: string[] = [];

		const unsubscribe = subscribe({ s }, ({ $s }) => {
			calls.push(`cb:${$s}`);
			return () => {
				calls.push('inv');
			};
		});

		// initial call
		expect(calls).toEqual(['cb:0']);

		// next update triggers invalidator then callback
		s.set(1);
		expect(calls).toEqual(['cb:0', 'inv', 'cb:1']);

		// unsubscribe triggers last invalidator consumption
		unsubscribe();
		expect(calls).toEqual(['cb:0', 'inv', 'cb:1', 'inv']);
	});

	it('unsubscribes from dependencies', () => {
		const a = new Signal(1);
		const spy = vi.fn();

		const unsubscribe = subscribe({ a }, ({ $a }) => {
			spy($a);
		});

		// initial call
		expect(spy).toHaveBeenCalledTimes(1);

		unsubscribe();

		// further updates should not call the callback
		spy.mockClear();
		a.set(2);
		expect(spy).not.toHaveBeenCalled();
	});
});
