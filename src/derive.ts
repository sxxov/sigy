/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { Signal } from './Signal';
import {
	type ReadableValue,
	type ReadableSignal,
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
 * @returns a readable signal of the computed value
 */
export function derive<
	Stores extends Record<string, ReadableSignal<any>>,
	Callback extends (values: DeriveCallbackValues<Stores>) => any,
>(stores: Stores, callback: Callback): Signal<ReturnType<Callback>>;
export function derive(
	stores: Record<string, ReadableSignal<any>>,
	callback?: (values: Record<string, any>) => any,
): Signal<any> {
	return callback ?
			deriveFromCallback(stores, callback)
		:	deriveFromValues(stores);
}

function deriveFromCallback<
	Stores extends Record<string, ReadableSignal<any>>,
	Callback extends (values: DeriveCallbackValues<Stores>) => any,
>(stores: Stores, callback: Callback): Signal<ReturnType<Callback>> {
	type Values = DeriveCallbackValues<Stores>;
	const entries = Object.entries(stores);

	if (entries.length <= 0) return new Signal(callback({} as Values));

	const values = Object.fromEntries(
		entries.map(([k, store]) => [`$${k}`, store.get()]),
	);

	return new Signal(callback(values as Values), ({ set }) => {
		const unsubscribes = entries.map(([k, store]) =>
			store.subscribeSoon((it) => {
				values[`$${k}`] = it;
				set(callback(values as Values));
			}),
		);
		set(callback(values as Values));
		return () => {
			for (const unsubscribe of unsubscribes) unsubscribe();
		};
	});
}

function deriveFromValues<Stores extends Record<string, ReadableSignal<any>>>(
	stores: Stores,
): Signal<DeriveRecordValues<Stores>> {
	type Values = DeriveRecordValues<Stores>;
	const entries = Object.entries(stores);

	if (entries.length <= 0) return new Signal({} as Values);

	const values = Object.fromEntries(
		entries.map(([k, store]) => [k, store.get()]),
	);

	const valuesStore = new Signal(values as Values, ({ set }) => {
		const unsubscribes = entries.map(([k, store]) =>
			store.subscribeSoon((it) => {
				values[k] = it;
				set(values as Values);

				// manually trigger store instead of relying on
				// derive callback identity
				valuesStore.trigger();
			}),
		);
		set(values as Values);
		return () => {
			for (const unsubscribe of unsubscribes) unsubscribe();
		};
	});
	return valuesStore;
}
