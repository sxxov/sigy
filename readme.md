# `sigy`

mini (synchronous) signals.

## installation

run:

```bash
npm i sigy
```

then:

```ts
import {} from 'sigy';
```

or via cdn:

```ts
import {} from 'https://cdn.jsdelivr.net/npm/sigy/+esm';
```

## usage

here's a mini demo.

```ts
import { Signal, subscribe, derive, bin } from 'sigy';

// create a "bin" to store our cleanup functions
const { collect, dispose } = bin();

// create signals
const a = new Signal(1);
const b = new Signal(2);

// collect the returned unsubscribe function into our bin
collect(
	// log the value of `a` & `b` when they change
	subscribe({ a, b }, ({ $a, $b }) => {
		console.log(`a: ${$a}, b: ${$b}`);
	}),
);

// create a `sum` signal when either `a` or `b` changes
// with the value of `a + b`
const sum = derive({ a, b }, ({ $a, $b }) => $a + $b);

// collect the returned unsubscribe function into our bin
collect(
	// log the value of `sum` when it changes
	subscribe({ sum }, ({ $sum }) => {
		console.log(`sum: ${$sum}`);
	}),
);

console.log(sum.get()); // 3
a.set(10);
// logs: a: 10, b: 2
// logs: sum: 12

// dispose of all collected subscriptions
dispose();
a.set(0);
// no logs, all done!
```

## api

docs are in source.

- [`Signal`](tree/main/src/Signal.ts)
- [`subscribe`](tree/main/src/subscribe.ts)
- [`derive`](tree/main/src/derive.ts)
- [`bin`](tree/main/src/bin.ts)

## license

MIT
