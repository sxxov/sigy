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
	/** invoke all callbacks & clear the bin. equivalent to {@link bin().dispose} */
	const instance = () => {
		instance.dispose();
	};
	/**
	 * add a callback to the bin.
	 *
	 * @param callback function to run during `process`/`dispose`
	 * @returns unsubscriber that removes the callback from the bin
	 */
	instance.collect = (callback: () => void | Promise<void>) => {
		callbacks.add(callback);
		return () => {
			callbacks.delete(callback);
		};
	};
	/**
	 * remove & return a specific callback from the bin without invoking it.
	 *
	 * @param callback the callback to extract
	 * @returns the same callback passed in
	 */
	instance.extract = (callback: () => void | Promise<void>) => {
		callbacks.delete(callback);
		return callback;
	};
	/**
	 * invoke all currently collected callbacks (without clearing the bin).
	 *
	 * callbacks are invoked in insertion order; async callbacks are started but
	 * not awaited.
	 */
	instance.process = () => {
		for (const callback of callbacks) void callback();
	};
	/** invoke all callbacks & clear the bin. */
	instance.dispose = () => {
		instance.process();
		callbacks.clear();
	};
	/**
	 * assignment helper that behaves like {@link bin().collect}.
	 *
	 * note: as a setter, this does not return a remover; use
	 * {@link bin().collect} directly if you need to un-collect a callback
	 * later.
	 */
	instance._ = undefined as
		| Parameters<typeof instance.collect>[0]
		| undefined;
	// eslint-disable-next-line accessor-pairs
	Object.defineProperty(instance, '_', {
		set: (value: Parameters<typeof instance.collect>[0]) => {
			instance.collect(value);
		},
	});

	return instance;
}
