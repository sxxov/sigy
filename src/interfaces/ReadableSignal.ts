/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { type Bondaged } from '~/utilities/bondage';
import { type WritableSignal } from './WritableSignal';

export type Subscriber<T> = (v: T) => MaybeInvalidator;
export type MaybeInvalidator = void | Invalidator | Promise<void | Invalidator>;
export type Invalidator = () => void | Promise<void>;
export type Unsubscriber = () => void;

export type Starter<T extends WritableSignal<any>> = (
	store: Bondaged<T>,
) => MaybeStopper;
export type MaybeStopper = void | Stopper | Promise<void | Stopper>;
export type Stopper = Invalidator;

export type ReadableValue<T extends ReadableSignal<any>> = ReturnType<T['get']>;

export interface ReadableSignal<T> {
	get(): T;
	trigger(): void;
	destroy(): void;

	subscribe(onValue: Subscriber<T>): Unsubscriber;
	subscribeSoon(onNextValue: Subscriber<T>): Unsubscriber;

	subscribeStart(onStart: Starter<WritableSignal<T> & this>): Unsubscriber;
	subscribeStartSoon(
		onNextStart: Starter<WritableSignal<T> & this>,
	): Unsubscriber;

	subscribeStop(onStop: Stopper): Unsubscriber;
	subscribeStopSoon(onNextStop: Stopper): Unsubscriber;

	out<O extends WritableSignal<any>>(to: O): O;
	derive<R>(fn: (v: T) => R): ReadableSignal<R>;
}
