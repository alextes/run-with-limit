# p-limit

Run multiple promise-returning & async functions with limited concurrency.
Heavily inspired by [sindresorhus/p-limit](https://github.com/sindresorhus/p-limit).

## Usage

```ts
import { makeRunWithLimit } from "https://denopkg.com/alextes/p-limit";

const { runWithLimit } = makeRunWithLimit(1);

const input = [
  runWithLimit(() => fetchSomething("foo")),
  runWithLimit(() => fetchSomething("bar")),
  runWithLimit(() => doSomething()),
];

(async () => {
  // Only one promise is run at once
  const result = await Promise.all(input);
  console.log(result);
})();
```

## API

### makeRunWithLimit(concurrency)
Returns an object with a couple functions.

### runWithLimit
Pass a thunk to this function that returns a promise.

### getActiveCount
The number of promises that are currently running.

### getPendingCount
Can be used to check how many promises are still waiting to start execution.
