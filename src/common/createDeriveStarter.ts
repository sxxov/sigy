import { type ReadableSignal, type Starter } from '~/interfaces/ReadableSignal';
import { coerceInvalidator } from './coerceInvalidator';
import { type WritableSignal } from '~/interfaces/WritableSignal';

/**
 * create a starter that wires an input readable signal to an output writable
 * signal via a mapping function. optionally composes a user-provided onStart.
 *
 * when the output starts, it subscribes to the input, applying `mapper` to
 * propagate changes into the output. when the output stops, it unsubscribes &
 * runs the composed stopper returned by `onStart`, if any.
 *
 * @typeParam T - input value type
 * @typeParam In - input readable signal type
 * @typeParam R - output value type
 * @typeParam Out - output writable signal type
 * @param input - input readable signal
 * @param mapper - mapping function from `T` to `R`
 * @param onStart - optional starter to run when output starts; its stopper is
 *   composed
 * @returns a starter suitable for the derived output signal
 */
export function createDeriveStarter<
	T,
	In extends ReadableSignal<T>,
	R,
	Out extends WritableSignal<R>,
>(input: In, mapper: (v: T) => R, onStart?: Starter<Out>): Starter<Out> {
	return (store) => {
		const maybeStopper = onStart?.(store);
		const stopper = coerceInvalidator(maybeStopper);
		const unsubscribe = input.subscribe((v) => {
			store.set(mapper(v));
		});

		return () => {
			void stopper?.();
			unsubscribe();
		};
	};
}
