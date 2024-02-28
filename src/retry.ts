export const retry = async <returnType>(
  callback: () => Promise<returnType>,
  {
    retries = 3,
    timeout = 100,
    exponential = true,
  }: {
    retries?: number;
    timeout?: number;
    exponential?: boolean;
  } = { retries: 3, timeout: 100, exponential: true },
): Promise<returnType> => {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: wrong
  return new Promise(async (resolve, reject) => {
    // biome-ignore lint/suspicious/noExplicitAny: errors don't have types
    let error: any;
    let hasError = false;

    for (let i = 0; i < retries + 1; i++) {
      try {
        const out = await callback();
        resolve(out);
        return;
      } catch (_error) {
        if (!hasError) {
          hasError = true;
          error = _error;
        }
        await new Promise((_resolve) =>
          setTimeout(_resolve, exponential ? timeout * 2 ** i : timeout),
        );
      }
    }
    reject(error);
  });
};
