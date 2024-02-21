import { test } from "bun:test";
import { assertType } from "./type-utils";

test("equal", () => {
  assertType<1, 1>();

  assertType<number, number>();

  assertType<"a" | "b", "a" | "b">();

  assertType<Promise<null>, Promise<null>>();

  assertType<{ [key: string]: string }, { [key: string]: string }>();

  assertType<readonly [true, false], readonly [true, false]>();

  assertType<never, never>;
});

test("not equal", () => {
  // @ts-expect-error
  assertType<1, 2>();

  // @ts-expect-error
  assertType<number, string>();

  // @ts-expect-error
  assertType<"a" | "b", "a">();

  // @ts-expect-error
  assertType<"a", "a" | "b">();

  // @ts-expect-error
  assertType<Promise<null>, null>();

  // @ts-expect-error
  assertType<readonly [true, false], [true, false]>();

  // @ts-expect-error
  assertType<never, unknown>();

  // @ts-expect-error
  assertType<unknown, never>();
});
