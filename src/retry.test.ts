import { expect, test } from "bun:test";
import { retry } from "./retry";
import { assertType } from "./type-utils";

test("returns with no errors", async () => {
  const callback = () => Promise.resolve(1);
  const out = retry(callback);
  expect(await out.promise).toBe(1);
});

test("returnType", () => {
  const callback = () => Promise.resolve(1 as const);
  const out = retry(callback);
  assertType<Promise<1>, typeof out.promise>();
});

test("retries", async () => {
  let i = 0;

  await retry(
    () => {
      i++;
      if (i === 1) return Promise.reject();
      return Promise.resolve();
    },
    { timeout: 1 },
  ).promise;

  expect(i).toBe(2);
});

test("cancel", async () => {
  let rejected = false;

  const out = retry(
    () => {
      return Promise.reject();
    },
    {
      timeout: 1_000,
      exponential: true,
    },
  );

  out.cancel();

  await out.promise.catch((e) => {
    if (e.message === "Retry canceled") rejected = true;
  });

  expect(rejected).toBe(true);
});

test.todo("calculates timeout");

test("throws error", async () => {
  let i = 0;
  let rejected = false;

  const out = retry(
    () => {
      i++;

      throw Error();
      // biome-ignore lint/correctness/noUnreachable: need for tests
      return Promise.resolve(1);
    },
    {
      timeout: 1,
      exponential: false,
    },
  ).promise;

  await out.catch(() => {
    rejected = true;
  });

  expect(i).toBe(4);
  expect(rejected).toBe(true);
});
