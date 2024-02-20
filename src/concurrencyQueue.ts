import {
  type PromiseWithResolvers,
  promiseWithResolvers,
} from "./promiseWithResolvers";

type Queue<parameter, returnType> = {
  parameter: parameter;
  resolve: (arg: returnType) => void;
  reject: (error: Error) => void;
}[];

export type ConcurrencyQueue<parameter, returnType> = {
  queue: Queue<parameter, returnType>;
  size: number;
  pending: number;
  add: (task: parameter) => Promise<returnType>;
  clear: () => void;
  start: () => void;
  pause: () => void;
  onIdle: () => Promise<void>;
  onEmpty: () => Promise<void>;
};

export const createConcurrencyQueue = <parameter, returnType>({
  concurrency,
  worker,
}: {
  concurrency: number;
  worker: (arg: parameter) => Promise<returnType>;
}): ConcurrencyQueue<parameter, returnType> => {
  let queue = new Array<Queue<parameter, returnType>[number]>();
  let pending = 0;
  let isStarted = false;

  let emptyPromiseWithResolvers:
    | (PromiseWithResolvers<void> & { completed: boolean })
    | undefined = undefined;
  let idlePromiseWithResolvers:
    | (PromiseWithResolvers<void> & { completed: boolean })
    | undefined = undefined;

  const next = () => {
    if (!isStarted) return;

    while (pending < concurrency && queue.length > 0) {
      const { parameter, resolve, reject } = queue.shift()!;

      pending++;

      worker(parameter)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          pending--;

          if (
            idlePromiseWithResolvers !== undefined &&
            queue.length === 0 &&
            pending === 0
          ) {
            idlePromiseWithResolvers.resolve();
            idlePromiseWithResolvers.completed = true;
          }

          process.nextTick(next);
        });

      if (emptyPromiseWithResolvers !== undefined && queue.length === 0) {
        emptyPromiseWithResolvers.resolve();
        emptyPromiseWithResolvers.completed = true;
      }
    }
  };

  next();

  return {
    queue,
    size: queue.length,
    pending,
    add: (task: parameter) => {
      const { promise, resolve, reject } = promiseWithResolvers<returnType>();
      queue.push({ parameter: task, resolve, reject });

      next();

      return promise;
    },
    clear: () => {
      queue = new Array<Queue<parameter, returnType>[number]>();
    },
    start: () => {
      isStarted = true;
      next();
    },
    pause: () => {
      isStarted = false;
    },
    onIdle: () => {
      if (
        idlePromiseWithResolvers === undefined ||
        idlePromiseWithResolvers.completed
      ) {
        idlePromiseWithResolvers = {
          ...promiseWithResolvers<void>(),
          completed: false,
        };
      }
      return idlePromiseWithResolvers.promise;
    },
    onEmpty: () => {
      if (
        emptyPromiseWithResolvers === undefined ||
        emptyPromiseWithResolvers.completed
      ) {
        emptyPromiseWithResolvers = {
          ...promiseWithResolvers<void>(),
          completed: false,
        };
      }
      return emptyPromiseWithResolvers.promise;
    },
  };
};
