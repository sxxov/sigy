import { describe, it, expect } from 'vitest';
import { Signal } from './Signal';

describe(Signal, () => {
	it('get/set/update: works', () => {
		const s = new Signal(0);
		expect(s.get()).toBe(0);

		s.set(1);
		expect(s.get()).toBe(1);

		s.update((v) => v + 1);
		expect(s.get()).toBe(2);
	});

	it('subscribe: calls immediately & on updates', () => {
		const s = new Signal(1);
		const values: number[] = [];

		const unsubscribe = s.subscribe((v) => {
			values.push(v);
		});

		expect(values).toEqual([1]);

		s.set(2);
		s.set(3);
		expect(values).toEqual([1, 2, 3]);

		unsubscribe();
		s.set(4);
		expect(values).toEqual([1, 2, 3]);
	});

	it('subscribeSoon: skips immediate call', () => {
		const s = new Signal(1);
		const values: number[] = [];

		const unsubscribe = s.subscribeSoon((v) => {
			values.push(v);
		});

		expect(values).toEqual([]);
		s.set(2);
		expect(values).toEqual([2]);

		unsubscribe();
	});

	it('start/stop lifecycle: via subscribers', () => {
		const s = new Signal(0);
		let started = 0;
		let stopped = 0;

		// register start handler that returns a stopper
		const unstart = s.subscribeStart(() => {
			started += 1;
			return () => {
				stopped += 1;
			};
		});

		// not started yet
		expect(started).toBe(0);

		// adding a subscriber starts the signal
		const unsubscribe = s.subscribeSoon(() => {});
		expect(started).toBe(1);

		// removing last subscriber stops it (calls stopper)
		unsubscribe();
		expect(stopped).toBe(1);

		// clean up registered start listener
		unstart();
	});

	it('start/stop lifecycle: via get/set', () => {
		const s = new Signal(0);
		let started = 0;

		const unstart = s.subscribeStartSoon(() => {
			started += 1;
		});

		// calling set should start & invoke the starter once
		s.set(1);
		expect(started).toBe(1);

		// immediately subscribe & unsubscribe to stop the store
		s.subscribe(() => {})();

		// calling get should start & invoke the starter again
		s.get();
		expect(started).toBe(2);

		// clean up
		unstart();
	});

	it('in: connects source to target & updates on start', () => {
		const source = new Signal(1);
		const target = new Signal(100);

		target.in(source);

		// starting via get should pull from source synchronously
		expect(target.get()).toBe(1);

		const seen: number[] = [];
		const unsub = target.subscribe((v) => {
			seen.push(v);
		});
		expect(seen).toEqual([1]);

		source.set(2);
		expect(seen).toEqual([1, 2]);

		unsub();
	});

	it('out: pushes updates into target when target starts', () => {
		const from = new Signal(5);
		const to = new Signal(0);

		from.out(to);

		const seen: number[] = [];
		// starting the `to` signal triggers wiring & immediate sync push from `from`
		const unsub = to.subscribe((v) => {
			seen.push(v);
		});

		expect(seen).toEqual([5]);

		from.set(7);
		expect(seen).toEqual([5, 7]);

		unsub();
	});

	it('derive: produces mapped signal, updates while started, & caches per mapper', () => {
		const base = new Signal(2);
		const mapper = (v: number) => v * 10;

		const d1 = base.derive(mapper);
		const d2 = base.derive(mapper);

		// same mapper returns same derived signal instance
		expect(d2).toBe(d1);
		expect(d1.get()).toBe(20);

		const seen: number[] = [];
		const unsub = d1.subscribe((v) => {
			seen.push(v);
		});
		expect(seen).toEqual([20]);

		base.set(3);
		expect(seen).toEqual([20, 30]);

		unsub();
	});

	it('start/stop lifecycle: starter receives bound methods & stopper runs on stop', () => {
		let started = 0;
		let stopped = 0;

		const s = new Signal(0, (store) => {
			// using bound methods inside onStart should work
			store.set(5);
			store.update((v) => v + 1);
			started += 1;
			return () => {
				stopped += 1;
			};
		});

		// reading starts the signal & invokes onStart once
		expect(s.get()).toBe(6);
		expect(started).toBe(1);

		// add a subscriber to allow a subsequent stop transition
		const unsub = s.subscribeSoon(() => {});
		// now remove last subscriber which should stop & invoke stopper
		unsub();
		expect(stopped).toBe(1);
	});
});
