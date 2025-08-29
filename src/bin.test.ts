import { describe, it, expect, vi } from 'vitest';
import { bin } from './bin';

describe(bin, () => {
	it('collect/process/dispose: manage callbacks', () => {
		const _ = bin();
		const calls: string[] = [];

		const a = () => {
			calls.push('a');
		};
		const bcb = () => {
			calls.push('b');
		};

		const unA = _.collect(a);
		_.collect(bcb);

		_.process();
		expect(calls).toEqual(['a', 'b']);

		// removing one prevents further calls for that callback
		unA();
		calls.length = 0;
		_.process();
		expect(calls).toEqual(['b']);

		// dispose calls remaining callbacks then clears
		calls.length = 0;
		_.dispose();
		expect(calls).toEqual(['b']);
		calls.length = 0;
		_.process();
		expect(calls).toEqual([]);
	});

	it('extract: removes a specific callback without invoking it', () => {
		const _ = bin();
		const spy = vi.fn();

		_.collect(spy);

		const returned = _.extract(spy);
		// unchanged identity
		expect(returned).toBe(spy);

		_.process();
		expect(spy).not.toHaveBeenCalled();
	});

	it('_ setter: assigning acts like collect', () => {
		const _ = bin();
		const calls: string[] = [];

		_._ = () => {
			calls.push('x');
		};
		_._ = () => {
			calls.push('y');
		};

		_.process();
		expect(calls).toEqual(['x', 'y']);

		calls.length = 0;
		_.dispose();
		expect(calls).toEqual(['x', 'y']);
	});

	it('return value calls dispose', () => {
		const _ = bin();
		const calls: string[] = [];

		_._ = () => {
			calls.push('z');
		};

		_();
		expect(calls).toEqual(['z']);
	});
});
