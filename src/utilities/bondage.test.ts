import { describe, it, expect } from 'vitest';
import { bondage } from './bondage';

describe(bondage, () => {
	it('binds methods to the original target (private fields ok)', () => {
		class Counter {
			#n = 0;
			inc() {
				this.#n += 1;
				return this.#n;
			}
			get() {
				return this.#n;
			}
		}

		const c = new Counter();
		const b = bondage(c);

		// calling through bound method should access private field on target
		expect(b.inc()).toBe(1);
		expect(b.get()).toBe(1);

		const { inc } = b as { inc: () => number };
		// detached call still bound to target
		expect(inc()).toBe(2);
		expect(b.get()).toBe(2);
	});

	it('caches bound functions per original function identity', () => {
		const obj = {
			v: 1,
			get() {
				return this.v;
			},
		};
		const p = bondage(obj);
		const f1 = p.get;
		const f2 = p.get;
		expect(f1).toBe(f2);
		// still bound
		expect(f1()).toBe(1);
	});
});

