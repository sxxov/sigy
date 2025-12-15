import { describe, it, expect, vi } from 'vitest';
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

	it('from values notifies subscribers when dependencies fire', () => {
		const count = new Signal(0);
		const label = new Signal('a');

		const d = derive({ count, label });

		const refs: { count: number; label: string }[] = [];
		const values: { count: number; label: string }[] = [];
		const unsubscribe = d.subscribe((value) => {
			refs.push(value);
			values.push({ ...value });
		});

		const ref = refs[0];

		count.set(1);
		count.trigger();
		label.set('b');

		expect(values).toEqual([
			{ count: 0, label: 'a' },
			{ count: 1, label: 'a' },
			{ count: 1, label: 'a' },
			{ count: 1, label: 'b' },
		]);
		expect(refs[1]).toBe(ref);
		expect(refs[2]).toBe(ref);
		expect(refs[3]).toBe(ref);

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

	it('with callback provides defined dependency values', () => {
		const count = new Signal(4);
		const label = new Signal('ok');

		const mapper = vi.fn(
			({ $count, $label }: { $count: number; $label: string }) =>
				`${$count}-${$label}`,
		);

		const d = derive({ count, label }, mapper);

		const seen: string[] = [];
		const unsubscribe = d.subscribe((v) => {
			seen.push(v);
		});

		expect(seen[0]).toBe('4-ok');
		expect(mapper.mock.calls.at(-1)?.[0]).toEqual({
			$count: 4,
			$label: 'ok',
		});

		label.set('ready');
		expect(seen[seen.length - 1]).toBe('4-ready');
		expect(mapper.mock.calls.at(-1)?.[0]).toEqual({
			$count: 4,
			$label: 'ready',
		});

		unsubscribe();
	});

	it('with empty inputs & callback computes once', () => {
		const d = derive({}, () => 'static');
		expect(d.get()).toBe('static');
	});

	it('get starts derives & returns computed values for records and callbacks', () => {
		const count = new Signal(5);
		const label = new Signal('ready');

		const record = derive({ count, label });
		const mapper = vi.fn(({ $count }: { $count: number }) => $count * 2);
		const mapped = derive({ count }, mapper);

		const recordValue = record.get();
		expect(recordValue).toEqual({ count: 5, label: 'ready' });

		const initialMapperCalls = mapper.mock.calls.length;
		expect(mapped.get()).toBe(10);
		expect(mapper.mock.calls.length).toBe(initialMapperCalls + 1);

		count.set(6);
		expect(record.get()).toBe(recordValue);
		expect(recordValue.count).toBe(6);

		expect(mapper.mock.calls.length).toBe(initialMapperCalls + 2);
		expect(mapped.get()).toBe(12);

		count.set(7);
		expect(mapped.get()).toBe(14);
		expect(mapper.mock.calls.length).toBe(initialMapperCalls + 3);
	});
});
