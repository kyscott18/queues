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

test("size", async () => {
  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => Promise.resolve(10),
  });

  queue.add();

  expect(queue.size()).toBe(1);
});

test("pending", async () => {
  const { promise, resolve } = promiseWithResolvers<void>();

  const queue = createConcurrencyQueue({
    concurrency: 10,
    worker: () => promise,
  });

  queue.start();

  queue.add();

  expect(queue.pending()).toBe(1);

  resolve();

  expect(queue.pending()).toBe(0);
});
