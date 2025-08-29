import { coerceInvalidator } from './common/coerceInvalidator';
import {
	type Invalidator,
	type MaybeInvalidator,
	type ReadableSignal,
	type ReadableValue,
} from '~/interfaces/ReadableSignal';

/**
 * shape of values passed to a subscribe callback: each input key `k` becomes a
 * `$k` property containing the current value of the corresponding signal.
 */
export type SubscribeCallbackValues<
	Stores extends Record<string, ReadableSignal<any>>,
> = {
	[k in keyof Stores as `$${k extends string | number ? k : never}`]: ReadableValue<
		Stores[k]
	>;
};

/**
 * subscribe to multiple readable signals & react to their combined values.
 *
 * the callback receives a single object with `$key` properties for each
 * dependency. it is called immediately with current values, & again whenever
 * any dependency changes. if the callback returns an invalidator, it runs
 * before the next callback execution & on unsubscribe.
 *
 * @typeParam T - dependency record mapping keys to readable signals
 * @param dependencies - record of readable signals to observe
 * @param callback - handler receiving `$`-prefixed current values; may return
 *   invalidator
 * @returns unsubscriber that removes all internal subscriptions & runs the last
 *   invalidator
 */
export function subscribe<const T extends Record<string, ReadableSignal<any>>>(
	dependencies: T,
	callback: (values: SubscribeCallbackValues<T>) => MaybeInvalidator,
) {
	type Values = SubscribeCallbackValues<T>;
	const entries = Object.entries(dependencies);

	const values = Object.fromEntries(
		entries.map(([k, store]) => /** @type {const} */ [
			`$${k}`,
			store.get(),
		]),
	);
	let invalidator: Invalidator | undefined;
	const invokeCallback = () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const maybeInvalidator = callback(values as Values);
		invalidator = coerceInvalidator(maybeInvalidator);
	};
	const consumeInvalidator = () => {
		if (!invalidator) return;

		void invalidator();
		invalidator = undefined;
	};

	const subscriber = (k: string, v: unknown) => {
		consumeInvalidator();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		values[`$${k}`] = v as any;
		invokeCallback();
	};

	const unsubscribes = entries.map(([k, store]) =>
		store.subscribeSoon((v) => {
			subscriber(k, v);
		}),
	);

	invokeCallback();

	return () => {
		for (const unsubscribe of unsubscribes) unsubscribe();
		consumeInvalidator();
	};
}
