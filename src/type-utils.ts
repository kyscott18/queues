type AssertTypeFn = {
  <expected, actual extends expected>(
    ...args: [expected] extends [actual] ? [] : never
  ): void;
};

const _assertType = () => {};

export const assertType = _assertType as AssertTypeFn;
