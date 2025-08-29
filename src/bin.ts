/**
 * create a simple callback bin to collect and later flush callbacks.
 *
 * The bin supports collecting callbacks, manually processing them, extracting a
 * specific callback, and disposing all collected callbacks at once.
 *
 * @returns utilities to manage the collected callbacks
 */
export function bin() {
	const callbacks = new Set<() => void | Promise<void>>();

	const collect = (callback: () => void | Promise<void>) => {
		callbacks.add(callback);
		return () => {
			callbacks.delete(callback);
		};
	};
	const extract = (callback: () => void | Promise<void>) => {
		callbacks.delete(callback);
		return callback;
	};
	const process = () => {
		for (const callback of callbacks) void callback();
	};
	const dispose = () => {
		process();
		callbacks.clear();
	};

	return {
		/**
		 * add a callback to the bin.
		 *
		 * @param callback function to run during `process`/`dispose`
		 * @returns unsubscriber that removes the callback from the bin
		 */
		collect,
		/**
		 * remove & return a specific callback from the bin without invoking it.
		 *
		 * @param callback the callback to extract
		 * @returns the same callback passed in
		 */
		extract,
		/**
		 * invoke all currently collected callbacks (without clearing the bin).
		 *
		 * callbacks are invoked in insertion order; async callbacks are started
		 * but not awaited.
		 */
		process,
		/** invoke all callbacks & clear the bin. */
		dispose,
		/**
		 * assignment helper that behaves like {@link collect}.
		 *
		 * note: as a setter, this does not return a remover; use {@link collect}
		 * directly if you need to un-collect a callback later.
		 */
		// eslint-disable-next-line accessor-pairs, @typescript-eslint/naming-convention
		set _(value: () => void | Promise<void>) {
			collect(value);
		},
	};
}
