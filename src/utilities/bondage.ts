/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type Bondaged<T> = {
	[K in keyof T]: T[K] extends (...args: infer A) => infer R ?
		T[K] & ((this: void, ...args: A) => R)
	:	T[K];
};

const targetToCache = new WeakMap<
	Record<any, any>,
	WeakMap<Function, Function>
>();

/**
 * bind all function properties of an object to the original target instance.
 *
 * returns a proxy where any function-valued property is cached & bound to the
 * backing object (not the proxy). this preserves access to class private fields
 * while ensuring callers can use methods without manual `bind`.
 *
 * @template T object type to bind
 * @param target object whose method properties will be bound
 * @returns proxy exposing the same shape with methods permanently bound
 */
export function bondage<T extends Record<any, any>>(target: T) {
	let cache = targetToCache.get(target);
	if (!cache) {
		cache = new WeakMap();
		targetToCache.set(target, cache);
	}

	const proxy = new Proxy<Bondaged<T>>(target, {
		get(target: Record<any, unknown>, prop: string, receiver: any) {
			const value = Reflect.get(target, prop, receiver);
			if (typeof value !== 'function') return value;

			let bound = cache.get(value);
			if (!bound) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
				bound = value.bind(target) as Function;
				cache.set(value, bound);
			}

			return bound;
		},
	});

	return proxy;
}
