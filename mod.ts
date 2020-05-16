interface Runnable<A> {
  fn: () => Promise<A>;
  resolve: (value?: A | PromiseLike<A> | undefined) => void;
  reject: (reason?: any) => void;
}

type MakeRunWithLimit = <A>(
  concurrency: number
) => {
  runWithLimit: (fn: () => Promise<A>) => Promise<A>;
  getActiveCount: () => number;
  getPendingCount: () => number;
  getQueue: () => Array<Runnable<A>>;
};

export const makeRunWithLimit: MakeRunWithLimit = <A>(concurrency: number) => {
  if (concurrency < 1) {
    throw new Error("concurrency should be a positive number");
  }

  const queue: Runnable<A>[] = [];
  let activeCount = 0;

  const run = async <A>({ fn, resolve, reject }: Runnable<A>) => {
    activeCount++;

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    activeCount--;

    const mNextRunnable = queue.shift();
    if (typeof mNextRunnable !== "undefined") {
      run(mNextRunnable);
    }
  };

  const enqueue = (runnable: Runnable<A>) => {
    if (activeCount < concurrency) {
      run(runnable);
    } else {
      queue.push(runnable);
    }
  };

  return {
    runWithLimit: (fn: () => Promise<A>) =>
      new Promise<A>((resolve, reject) => enqueue({ fn, resolve, reject })),
    getActiveCount: () => activeCount,
    getPendingCount: () => queue.length,
    getQueue: () => queue,
  };
};
