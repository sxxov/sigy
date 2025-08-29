import { describe, it, expect, vi } from 'vitest';
import { bin } from './bin';

describe(bin, () => {
	it('collect/process/dispose: manage callbacks', () => {
		const b = bin();
		const calls: string[] = [];

		const a = () => {
			calls.push('a');
		};
		const bcb = () => {
			calls.push('b');
		};

		const unA = b.collect(a);
		b.collect(bcb);

		b.process();
		expect(calls).toEqual(['a', 'b']);

		// removing one prevents further calls for that callback
		unA();
		calls.length = 0;
		b.process();
		expect(calls).toEqual(['b']);

		// dispose calls remaining callbacks then clears
		calls.length = 0;
		b.dispose();
		expect(calls).toEqual(['b']);
		calls.length = 0;
		b.process();
		expect(calls).toEqual([]);
	});

	it('extract: removes a specific callback without invoking it', () => {
		const b = bin();
		const spy = vi.fn();

		b.collect(spy);

		const returned = b.extract(spy);
		// unchanged identity
		expect(returned).toBe(spy);

		b.process();
		expect(spy).not.toHaveBeenCalled();
	});
});
