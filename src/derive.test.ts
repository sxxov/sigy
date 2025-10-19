import { describe, it, expect } from 'vitest';
import { Signal } from './Signal';
import { derive } from './derive';

describe(derive, () => {
	it('from values returns record with stable identity', () => {
		const a = new Signal(1);
		const b = new Signal('x');

		const d = derive({ a, b });

		const v1 = d.get();
		expect(v1).toEqual({ a: 1, b: 'x' });

		// subscribing should immediately emit current values
		const received: any[] = [];
		const unsubscribe = d.subscribe((v) => {
			received.push(v);
		});
		expect(received.length).toBe(1);
		expect(received[0]).toEqual({ a: 1, b: 'x' });

		// updates to dependencies should keep object identity but change contents
		a.set(2);
		const v2 = d.get();
		expect(v2).toBe(v1); // same reference
		expect(v2).toEqual({ a: 2, b: 'x' });

		b.set('y');
		const v3 = d.get();
		expect(v3).toBe(v1);
		expect(v3).toEqual({ a: 2, b: 'y' });

		unsubscribe();
	});

	it('from values emits latest state when dependencies change before subscribing', () => {
		const count = new Signal(1);
		const label = new Signal('initial');

		const d = derive({ count, label });

		count.set(2);
		label.set('updated');

		const seen: { count: number; label: string }[] = [];
		const unsubscribe = d.subscribe((value) => {
			seen.push(value);
		});

		expect(seen).toEqual([{ count: 2, label: 'updated' }]);
		expect(d.get()).toBe(seen[0]);

		unsubscribe();
	});

	it('with callback computes from $-prefixed values', () => {
		const count = new Signal(2);
		const label = new Signal('units');

		const d = derive(
			{ count, label },
			({ $count, $label }) => `${$count} ${$label}`,
		);

		expect(d.get()).toBe('2 units');

		// subscribes & emits current computed value
		const values: string[] = [];
		const unsubscribe = d.subscribe((v) => {
			values.push(v);
		});

		// ensure subscriber saw initial value
		expect(values[0]).toBe('2 units');

		expect(d.get()).toBe(values[values.length - 1]);

		unsubscribe();
	});

	it('with callback emits latest computation when dependencies change before subscribing', () => {
		const count = new Signal(1);
		const label = new Signal('unit');

		const d = derive(
			{ count, label },
			({ $count, $label }) => `${$count} ${$label}`,
		);

		count.set(5);
		label.set('items');

		const seen: string[] = [];
		const unsubscribe = d.subscribe((value) => {
			seen.push(value);
		});

		expect(seen).toEqual(['5 items']);
		expect(d.get()).toBe(seen[0]);

		unsubscribe();
	});

	it('with callback composes onStart starter and stopper', () => {
		const count = new Signal(1);
		const starts: number[] = [];
		let stops = 0;

		const d = derive(
			{ count },
			({ $count }) => $count * 2,
			(store) => {
				starts.push(store.get());
				return () => {
					stops += 1;
				};
			},
		);

		const unsubscribeA = d.subscribe(() => {});
		expect(starts).toEqual([2]);
		expect(stops).toBe(0);

		count.set(3);
		unsubscribeA();
		expect(stops).toBe(1);

		count.set(7);

		const unsubscribeB = d.subscribe(() => {});
		expect(starts).toEqual([2, 14]);
		expect(stops).toBe(1);

		unsubscribeB();
		expect(stops).toBe(2);
	});

	it('with callback recomputes on dependency change', () => {
		const count = new Signal(2);
		const label = new Signal('units');

		const d = derive(
			{ count, label },
			({ $count, $label }) => `${$count} ${$label}`,
		);

		const seen: string[] = [];
		const unsubscribe = d.subscribe((v) => {
			seen.push(v);
		});

		// initial emission
		expect(seen).toEqual(['2 units']);

		// expect synchronous recompute on dependency change
		count.set(3);
		expect(seen).toContain('3 units');

		label.set('items');
		expect(seen).toContain('3 items');

		// latest value via get
		expect(d.get()).toBe('3 items');

		unsubscribe();
	});

	it('with empty inputs & callback computes once', () => {
		const d = derive({}, () => 'static');
		expect(d.get()).toBe('static');
	});
});
