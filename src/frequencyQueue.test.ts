import { expect, test } from "bun:test";
import { createFrequencyQueue } from "./frequencyQueue";
import { promiseWithResolvers } from "./promiseWithResolvers";
import { assertType } from "./type-utils";

test("add resolves", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(1),
  });

  queue.start();

  const promise = queue.add();

  expect(await promise).toBe(1);
});

test("add rejects", async () => {
  let rejected = false;

  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.reject(),
  });

  const promise = queue.add();

  queue.start();

  await promise.catch(() => {
    rejected = true;
  });

  expect(rejected).toBe(true);
});

test("size", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();

  expect(queue.size()).toBe(1);

  queue.start();

  expect(queue.size()).toBe(0);
});

test("pending", async () => {
  const { promise, resolve } = promiseWithResolvers<void>();

  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => promise,
  });

  queue.start();

  queue.add();

  expect(await queue.pending()).toBe(1);

  resolve();

  expect(await queue.pending()).toBe(0);
});

test("clear", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();
  queue.add();
  queue.add();

  queue.clear();

  expect(queue.size()).toBe(0);
});

test("isStarted", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  expect(queue.isStarted()).toBe(false);

  queue.start();

  expect(queue.isStarted()).toBe(true);
});

test("start", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  const promise = queue.add();

  expect(queue.size()).toBe(1);

  queue.start();

  expect(queue.isStarted()).toBe(true);

  await promise;

  expect(queue.size()).toBe(0);
});

test("pause", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.start();
  queue.pause();

  queue.add();

  expect(queue.size()).toBe(1);
});

test("onIdle short loop", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  await queue.onIdle();
});

test("onIdle", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();

  const promise = queue.onIdle();

  queue.start();

  await promise;
});

test("onIdle twice", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();

  queue.onIdle();

  queue.start();

  queue.pause();

  queue.add();

  const promise = queue.onIdle();

  queue.start();

  await promise;
});

test("onEmpty short loop", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  await queue.onEmpty();
});

test("onEmpty", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();

  const promise = queue.onEmpty();

  queue.start();

  await promise;
});

test("onEmpty twice", async () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => Promise.resolve(),
  });

  queue.add();

  queue.onEmpty();

  queue.start();

  queue.pause();

  queue.add();

  const promise = queue.onEmpty();

  queue.start();

  await promise;
});

test.todo("frequency");

test.todo("event loop");

test("parameter type", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: (_arg: "a" | "b" | "c") => Promise.resolve(),
  });

  assertType<Parameters<typeof queue.add>[0], "a" | "b" | "c">();
});

test("return type", () => {
  const queue = createFrequencyQueue({
    frequency: 1,
    worker: () => {
      return undefined as unknown as Promise<1 | 2 | 3>;
    },
  });

  assertType<ReturnType<typeof queue.add>, Promise<1 | 2 | 3>>();
});
