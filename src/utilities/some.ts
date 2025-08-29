/**
 * type guard that checks whether a value is neither `undefined` nor `null`.
 *
 * @param value value to test
 * @returns true if value is defined (not undefined/null)
 */
export function some<T>(value: T | undefined | null): value is T {
	return value !== undefined && value !== null;
}
