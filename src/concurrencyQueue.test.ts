import { expect, test } from "bun:test";
import { createConcurrencyQueue } from "./concurrencyQueue";
import { promiseWithResolvers } from "./promiseWithResolvers";

test("add", async () => {
  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => Promise.resolve(10),
  });

  queue.start();

  const promise = queue.add();

  expect(await promise).toBe(10);
});

test("size", () => {
  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => Promise.resolve(10),
  });

  queue.add();

  expect(queue.size()).toBe(1);

  queue.start();

  expect(queue.size()).toBe(0);
});

test("pending", async () => {
  const { promise, resolve } = promiseWithResolvers<void>();

  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => promise,
  });

  queue.start();

  queue.add();

  expect(await queue.pending()).toBe(1);

  resolve();

  expect(await queue.pending()).toBe(0);
});

test("clear", () => {
  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => Promise.resolve(10),
  });

  queue.add();
  queue.add();
  queue.add();

  queue.clear();

  expect(queue.size()).toBe(0);
});

test("isStarted", () => {
  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => Promise.resolve(10),
  });

  expect(queue.isStarted()).toBe(false);

  queue.start();

  expect(queue.isStarted()).toBe(true);
});

test.todo("start");

test.todo("pause");

test.todo("onIdle");

test.todo("onEmpty");

test.todo("event loop", () => {
  // test to make sure tasks are switching off when there are more than one queue
});
