import { coerceInvalidator } from './common/coerceInvalidator';
import {
	type Unsubscriber,
	type ReadableSignal,
	type Starter,
	type Invalidator,
	type Subscriber,
} from '~/interfaces/ReadableSignal';
import { type WritableSignal } from '~/interfaces/WritableSignal';
import { createDeriveStarter } from './common/createDeriveStarter';
import { bondage } from './utilities/bondage';
import { some } from './utilities/some';

/**
 * a minimal reactive signal with start/stop lifecycle, subscriptions, &
 * derivation.
 *
 * reads (via `get`) start the signal; when no subscribers remain it stops &
 * runs any registered stoppers. supports wiring with `in`/`out` & deriving
 * mapped signals with `derive`.
 */
export class Signal<T> implements WritableSignal<T> {
	/**
	 * compare two values with special handling for `NaN` where `NaN` equals
	 * `NaN`.
	 *
	 * @param a - left value
	 * @param b - right value
	 * @returns true if equal by identity or both are `NaN`
	 */
	public static compare(a: unknown, b: unknown) {
		if (Number.isNaN(a) && Number.isNaN(b)) return true;
		if (a === b) return true;
		return false;
	}

	protected value: T;

	private readonly invalidators = new Set<Invalidator>();
	private readonly subscribers = new Set<Subscriber<T>>();

	private readonly starters = new Set<Starter<T>>();
	private readonly stoppers = new Set<Unsubscriber>();

	private startedValue = false;
	public get started() {
		return this.startedValue;
	}
	protected set started(/** @type {boolean} */ it: boolean) {
		if (this.startedValue === it) return;

		if (it) {
			this.startedValue = true;
			for (const starter of this.starters) this.invokeStarter(starter);
		} else {
			this.startedValue = false;
			for (const stopper of this.stoppers) stopper();
		}
	}

	get subscribed() {
		return this.subscribers.size > 0;
	}

	protected readonly deriveMapperToSignal = new WeakMap<
		(v: any) => any,
		Signal<any>
	>();
	private readonly connectedInStores = new WeakSet<ReadableSignal<any>>();
	private readonly connectedOutStores = new WeakSet<WritableSignal<any>>();

	/**
	 * create a new signal.
	 *
	 * @param value - initial value
	 * @param onStart - optional starter invoked when the signal starts; its
	 *   return value is treated as a stopper
	 */
	constructor(value: T, onStart?: Starter<T>) {
		this.value = value;

		if (onStart) this.starters.add(onStart);
	}

	/**
	 * returns a cast into read-only view of the signal.
	 *
	 * since only the type is changed, the identity of the object remains the
	 * same & you can technically still call {@linkcode set} et al. by ignoring
	 * the typechecker.
	 */
	public get readonly() {
		return this as ReadableSignal<T>;
	}

	/**
	 * set the signal value & notify subscribers if it changed. comparison uses
	 * {@link Signal.compare}.
	 *
	 * @param v - new value
	 */
	public set(v: T) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		const ctor = this.constructor as typeof Signal;
		if (ctor.compare(this.get(), v)) return;

		this.value = v;
		this.trigger();
	}

	/**
	 * update the current value using a mapping function.
	 *
	 * @param mapper - function receiving the current value & returning the next
	 *   value
	 */
	public update(mapper: (v: T) => T) {
		this.set(mapper(this.get()));
	}

	/**
	 * read the current value & start the signal if not already started.
	 *
	 * @returns current value
	 */
	public get() {
		this.started = true;

		return this.value;
	}

	/** notify all subscribers with the current value & run queued invalidators. */
	public trigger() {
		for (const invalidator of this.invalidators) void invalidator();

		for (const subscriber of this.subscribers)
			this.invokeSubscriber(subscriber);
	}

	/**
	 * subscribe & receive an immediate call with the current value, then on
	 * updates.
	 *
	 * @param onValue - subscriber receiving values; may return an invalidator
	 * @returns unsubscriber
	 */
	public subscribe(onValue: (v: T) => void) {
		this.invokeSubscriber(onValue);

		return this.subscribeSoon(onValue);
	}

	/**
	 * subscribe for future updates only (no immediate call).
	 *
	 * @param onNextValue - subscriber for subsequent values; may return an
	 *   invalidator
	 * @returns unsubscriber
	 */
	public subscribeSoon(onNextValue: (v: T) => void) {
		this.subscribers.add(onNextValue);

		if (this.subscribed) this.started = true;

		/** @type {Unsubscriber} */
		const unsubscribe: Unsubscriber = () => {
			this.subscribers.delete(onNextValue);

			if (!this.subscribed) this.started = false;
		};

		return unsubscribe;
	}

	/**
	 * subscribe to start events. if already started, invokes immediately.
	 *
	 * @param onStart - starter receiving a bound handle to this signal; may
	 *   return a stopper
	 * @returns unsubscriber for the start listener
	 */
	public subscribeStart(onStart: Starter<T>) {
		if (this.started) this.invokeStarter(onStart);

		return this.subscribeStartSoon(onStart);
	}

	/**
	 * subscribe to future start events (no immediate call).
	 *
	 * @param onNextStart - starter to register
	 * @returns unsubscriber for the start listener
	 */
	public subscribeStartSoon(onNextStart: Starter<T>) {
		this.starters.add(onNextStart);

		return () => {
			this.starters.delete(onNextStart);
		};
	}

	/**
	 * subscribe to stop events. if not started, invokes immediately.
	 *
	 * @param onStop - stopper to run when the signal stops
	 * @returns unsubscriber for the stop listener
	 */
	public subscribeStop(onStop: () => void) {
		if (!this.started) onStop();

		return this.subscribeStopSoon(onStop);
	}

	/**
	 * subscribe to future stop events (no immediate call).
	 *
	 * @param onNextStop - stopper to register
	 * @returns unsubscriber for the stop listener
	 */
	public subscribeStopSoon(onNextStop: () => void) {
		this.stoppers.add(onNextStop);

		return () => {
			this.stoppers.delete(onNextStop);
		};
	}

	protected flush() {
		for (const invalidator of this.invalidators) void invalidator();
		for (const stopper of this.stoppers) stopper();
		this.subscribers.clear();
	}

	/** clear all listeners & release the current value for gc. */
	public destroy() {
		this.flush();
		// clear the value to allow GC
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		this.value = undefined as any;
	}

	/**
	 * wire this signal to read from another readable signal. when this signal
	 * starts, it subscribes to `from` & mirrors its values. repeated calls with
	 * the same source are ignored.
	 *
	 * @param from - source readable signal
	 * @returns this signal for chaining
	 */
	public in(from: ReadableSignal<T>) {
		if (this.connectedInStores.has(from)) return this;

		this.subscribeStart(({ set }) =>
			from.subscribe((v) => {
				set(v);
			}),
		);

		this.connectedInStores.add(from);

		return this;
	}

	/**
	 * wire this signal to push values into another writable signal. when `to`
	 * starts, it subscribes to this signal & receives updates. repeated calls
	 * with the same target are ignored.
	 *
	 * @typeParam O - target writable signal type
	 * @param to - destination writable signal
	 * @returns the destination signal for chaining
	 */
	public out<O extends WritableSignal<any>>(to: O) {
		if (this.connectedOutStores.has(to)) return to;
		this.connectedOutStores.add(to);

		to.subscribeStart(() => {
			const unsubscribe = this.subscribe((v) => {
				to.set(v);
			});

			return () => {
				unsubscribe();
				this.connectedOutStores.delete(to);
			};
		});

		return to;
	}

	/**
	 * create a derived signal by mapping this signal's values.
	 *
	 * the returned signal starts when read or subscribed to, wires to this
	 * signal, & updates by applying `mapper`. the same mapper function identity
	 * returns the same derived instance (memoized per-mapper).
	 *
	 * @typeParam R - derived value type
	 * @param mapper - mapping function from current value to derived value
	 * @param onStart - optional starter for the derived signal
	 * @returns derived signal
	 */
	public derive<R>(mapper: (v: T) => R, onStart?: Starter<R>): Signal<R> {
		let signal = this.deriveMapperToSignal.get(mapper) as
			| Signal<R>
			| undefined;
		if (!signal) {
			signal = new Signal(
				mapper(this.get()),
				createDeriveStarter(this, mapper, onStart),
			);
			this.deriveMapperToSignal.set(mapper, signal);
		}

		return signal;
	}

	private invokeSubscriber(subscriber: Subscriber<T>) {
		const maybeInvalidator = subscriber(this.get());
		const invalidator = coerceInvalidator(maybeInvalidator);
		if (invalidator)
			this.invalidators.add(() => {
				void invalidator();
				this.invalidators.delete(invalidator);
			});
	}

	private invokeStarter(starter: Starter<T>) {
		const maybeStopper = starter(bondage(this));
		const stopper = coerceInvalidator(maybeStopper);
		if (some(stopper))
			this.stoppers.add(() => {
				void stopper();
				this.stoppers.delete(stopper);
			});
	}

	/**
	 * coerce the contained value to a primitive via `valueOf`.
	 *
	 * @returns primitive representation of the current value, if any
	 */
	public valueOf() {
		return this.get()?.valueOf();
	}
}
