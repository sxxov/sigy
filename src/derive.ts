/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { bin } from './bin';
import { coerceInvalidator } from './common/coerceInvalidator';
import { Signal } from './Signal';
import {
	type ReadableValue,
	type ReadableSignal,
	type Starter,
} from '~/interfaces/ReadableSignal';

/**
 * values passed to a derive callback: each input key `k` becomes `$k` with its
 * current value.
 */
export type DeriveCallbackValues<
	Stores extends Record<string, ReadableSignal<any>>,
> = {
	[k in keyof Stores as `$${k extends string | number ? k : never}`]: ReadableValue<
		Stores[k]
	>;
};
/**
 * record shape produced by derive without a callback: same keys as inputs with
 * current values.
 */
export type DeriveRecordValues<
	Stores extends Record<string, ReadableSignal<any>>,
> = {
	[k in keyof Stores]: ReadableValue<Stores[k]>;
};

/**
 * **record derive**: returns a signal of a record mirroring the input keys with
 * their latest values; updates preserve object identity while mutating its
 * properties.
 *
 * @template Stores record mapping keys to readable signals
 * @param stores input readable signals
 * @returns a readable signal of the current values per key
 */
export function derive<Stores extends Record<string, ReadableSignal<any>>>(
	stores: Stores,
): Signal<DeriveRecordValues<Stores>>;
/**
 * **mapper derive**: computes an output value from `$`-prefixed input values
 * and updates when any input changes.
 *
 * @template Stores record mapping keys to readable signals
 * @template Callback mapping from `$`-values to the derived value
 * @param stores input readable signals
 * @param callback mapping function from `$`-values to output
 * @param onStart optional starter for the derived signal
 * @returns a readable signal of the computed value
 */
export function derive<
	Stores extends Record<string, ReadableSignal<any>>,
	Callback extends (values: DeriveCallbackValues<Stores>) => any,
>(
	stores: Stores,
	callback: Callback,
	onStart?: Starter<Signal<ReturnType<Callback>>>,
): Signal<ReturnType<Callback>>;
export function derive(
	stores: Record<string, ReadableSignal<any>>,
	callback?: (values: Record<string, any>) => any,
	onStart?: Starter<Signal<any>>,
): Signal<any> {
	return callback ?
			deriveFromCallback(stores, callback, onStart)
		:	deriveFromValues(stores);
}

function deriveFromCallback<
	Stores extends Record<string, ReadableSignal<any>>,
	Callback extends (values: DeriveCallbackValues<Stores>) => any,
>(
	stores: Stores,
	callback: Callback,
	onStart?: Starter<Signal<ReturnType<Callback>>>,
): Signal<ReturnType<Callback>> {
	type Values = DeriveCallbackValues<Stores>;
	type Key = keyof Values;
	const entries = Object.entries(stores);

	if (entries.length <= 0) return new Signal(callback({} as Values));

	const values = {} as Values;
	const signal = new Signal(callback(values), (store) => {
		const _ = bin();
		const { set } = store;

		for (const [k, store] of entries) values[`$${k}` as Key] = store.get();
		set(callback(values));

		const maybeStopper = onStart?.(store);
		const invalidator = coerceInvalidator(maybeStopper);
		if (invalidator) _._ = invalidator;

		for (const [k, store] of entries)
			_._ = store.subscribeSoon((it) => {
				values[`$${k}` as Key] = it;
				set(callback(values));
			});

		return _;
	});
	return signal;
}

function deriveFromValues<Stores extends Record<string, ReadableSignal<any>>>(
	stores: Stores,
): Signal<DeriveRecordValues<Stores>> {
	type Values = DeriveRecordValues<Stores>;
	type Key = keyof Values;
	const entries = Object.entries(stores);

	if (entries.length <= 0) return new Signal({} as Values);

	const values = {} as Values;
	const signal = new Signal(values, () => {
		const _ = bin();

		for (const [k, store] of entries) values[k as Key] = store.get();
		for (const [k, store] of entries)
			_._ = store.subscribeSoon((it) => {
				values[k as Key] = it;

				// we need to do a manual trigger here since we're never
				// changing the returned `values` object
				signal.trigger();
			});

		return _;
	});
	return signal;
}
