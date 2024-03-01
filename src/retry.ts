import { promiseWithResolvers } from ".";

export const retry = <returnType>(
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
): { promise: Promise<returnType>; cancel: () => void } => {
  const { promise, resolve, reject } = promiseWithResolvers<returnType>();

  // biome-ignore lint/suspicious/noExplicitAny: no
  let error: any;
  let hasError = false;

  let timer: Timer;

  const process = async () => {
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

        await new Promise((_resolve) => {
          timer = setTimeout(
            _resolve,
            exponential ? timeout * 2 ** i : timeout,
          );
        });
      }
    }
    reject(error);
  };

  process();

  return {
    promise,
    cancel: () => {
      clearTimeout(timer);
      reject(new Error("Retry canceled"));
    },
  };
};
