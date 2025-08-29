import { describe, it, expect } from 'vitest';
import { createDeriveStarter } from './createDeriveStarter';
import { Signal } from '~/Signal';

describe(createDeriveStarter, () => {
	it('wires input to output applying mapper while started', () => {
		const input = new Signal(1);
		const starter = createDeriveStarter(input, (v) => v * 2);

		const output = new Signal(0, starter);

		const seen: number[] = [];
		const unsub = output.subscribe((v) => {
			seen.push(v);
		});

		// subscribing starts output and synchronizes from input immediately
		expect(seen).toEqual([2]);
		// get reflects current mapped value
		expect(output.get()).toBe(2);

		input.set(3);
		expect(output.get()).toBe(6);

		unsub();
	});

	it('composes onStart stopper and unsubscribes on stop', () => {
		const input = new Signal(1);
		let started = 0;
		let stopped = 0;

		const customOnStart = () => {
			started += 1;
			return () => {
				stopped += 1;
			};
		};

		const starter = createDeriveStarter(input, (v) => v + 1, customOnStart);
		const output = new Signal(0, starter);

		const unsub = output.subscribe(() => {});
		expect(started).toBe(1);

		// change input while subscribed propagates
		input.set(5);
		expect(output.get()).toBe(6);

		// stopping output triggers composed stopper and unsubscribes
		unsub();
		expect(stopped).toBe(1);

		// further input updates while stopped do not propagate until restart
		input.set(9);
		// reading (get) restarts and synchronizes immediately
		expect(output.get()).toBe(10);
	});
});
