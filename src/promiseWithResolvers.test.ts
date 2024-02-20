import { expect, test } from "bun:test";
import { promiseWithResolvers } from "./promiseWithResolvers";
import { assertType } from "./type-utils";

test("resolves", async () => {
  const { promise, resolve } = promiseWithResolvers();

  resolve(1);

  const value = await promise;

  expect(value).toBe(1);
});

test.skip("rejects", async () => {
  const { promise, reject } = promiseWithResolvers();

  try {
    new Error();
  } catch (e) {
    reject(e as Error);
  }

  expect(async () => await promise).toThrow();
});

test("resolve type", () => {
  const { resolve } = promiseWithResolvers<number>();

  assertType<(arg: number) => void, typeof resolve>();
});

test("promise type", () => {
  const { promise } = promiseWithResolvers<number>();

  assertType<Promise<number>, typeof promise>();
});
