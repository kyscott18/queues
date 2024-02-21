import { expect, test } from "bun:test";
import { promiseWithResolvers } from "./promiseWithResolvers";
import { assertType } from "./type-utils";

test("resolves", async () => {
  const { promise, resolve } = promiseWithResolvers<number>();

  resolve(1);

  const value = await promise;

  expect(value).toBe(1);
});

test("rejects", async () => {
  let rejected = false;

  const { promise, reject } = promiseWithResolvers();

  promise.catch(() => {
    rejected = true;
  });

  await Promise.reject().catch(reject);

  expect(rejected).toBe(true);
});

test("resolve type", () => {
  const { resolve } = promiseWithResolvers<number>();
  assertType<(arg: number) => void, typeof resolve>();
});

test("promise type", () => {
  const { promise } = promiseWithResolvers<number>();
  assertType<Promise<number>, typeof promise>();
});
