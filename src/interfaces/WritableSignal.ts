import type { ReadableSignal } from './ReadableSignal';

export type Updater<T> = (v: T) => T;

export interface WritableSignal<T> extends ReadableSignal<T> {
	set(value: T): void;
	update(updater: Updater<T>): void;

	in(from: ReadableSignal<T>): WritableSignal<T>;
}
