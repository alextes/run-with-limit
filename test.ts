import {
  assertEquals,
  assert,
  assertThrowsAsync,
} from "https://deno.land/std/testing/asserts.ts";
import { makeRunWithLimit } from "./mod.ts";

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

const delay = (delay: number, value?: number) =>
  new Promise((resolve) => setTimeout(resolve, delay, value));

Deno.test("concurrency of one executes one after the other", async () => {
  const input = [() => delay(200, 0), () => delay(300, 1), () => delay(100, 2)];

  const { runWithLimit, getActiveCount, getPendingCount } = makeRunWithLimit(1);
  const pEnd = Promise.all(input.map(runWithLimit));

  assertEquals(getActiveCount(), 1);
  assertEquals(getPendingCount(), 2);
  await delay(1000);
  assertEquals(getActiveCount(), 0);
  assertEquals(getPendingCount(), 0);
  assertEquals(await pEnd, [0, 1, 2]);
});

Deno.test("concurrency of four keeps four promises running", async () => {
  const concurrency = 4;
  let running = 0;
  const { runWithLimit } = makeRunWithLimit(concurrency);

  const pInput = Array.from({ length: 20 }, () =>
    runWithLimit(async () => {
      running++;
      assert(running <= concurrency);
      await delay(getRandomInt(30, 200));
      running--;
    })
  );

  await Promise.all(pInput);
});

Deno.test("rejects on error", async () => {
  const { runWithLimit } = makeRunWithLimit<void>(1);
  assertThrowsAsync(() =>
    runWithLimit(async () => {
      throw new Error("💣");
    })
  );
});

Deno.test("getActiveCount and getPendingCount", async () => {
  const { runWithLimit, getActiveCount, getPendingCount } = makeRunWithLimit(5);

  assertEquals(getActiveCount(), 0);
  assertEquals(getPendingCount(), 0);

  const p1 = runWithLimit(() => delay(200));
  assertEquals(getActiveCount(), 1);
  assertEquals(getPendingCount(), 0);

  await p1;
  assertEquals(getActiveCount(), 0);
  assertEquals(getPendingCount(), 0);

  const immediatePromises = Array.from({ length: 5 }, () =>
    runWithLimit(() => delay(500))
  );
  const delayedPromises = Array.from({ length: 3 }, () =>
    runWithLimit(() => delay(500))
  );

  assertEquals(getActiveCount(), 5);
  assertEquals(getPendingCount(), 3);

  await Promise.all(immediatePromises);
  assertEquals(getActiveCount(), 3);
  assertEquals(getPendingCount(), 0);

  await Promise.all(delayedPromises);
  assertEquals(getActiveCount(), 0);
  assertEquals(getPendingCount(), 0);
});
