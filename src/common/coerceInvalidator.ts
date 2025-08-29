/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import {
	type MaybeInvalidator,
	type Invalidator,
} from '~/interfaces/ReadableSignal';
import { some } from '~/utilities/some';

/**
 * normalize a maybe-invalidator into a concrete invalidator function if
 * present.
 *
 * accepts a value that can be:
 *
 * - `undefined`/`void`: returns `undefined`
 * - a function: returns the function
 * - a promise resolving to `void` or a function: returns a function that, when
 *   invoked, awaits & runs the resolved invalidator (fire & forget)
 *
 * @param maybeInvalidator - value or promise that may contain an invalidator
 * @returns an invalidator function, or `undefined` if not present
 */
export function coerceInvalidator<T extends MaybeInvalidator>(
	maybeInvalidator: T,
):
	| Extract<T, Invalidator>
	| (T extends Promise<any> ? () => void : never)
	| undefined {
	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
	switch (true) {
		case !some(maybeInvalidator):
			return;
		case typeof maybeInvalidator === 'object' && 'then' in maybeInvalidator:
			return (() => {
				void (
					maybeInvalidator as Pick<
						Promise<Invalidator | undefined>,
						'then'
					>
				).then((it) => {
					if (typeof it === 'function') void it();
				});
			}) as Extract<T, Invalidator>;
		case typeof maybeInvalidator === 'function':
			return maybeInvalidator as Extract<T, Invalidator>;
		default:
	}
}
