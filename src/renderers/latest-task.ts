export type LatestTaskScheduler = {
  schedule<T>(task: () => Promise<T>, onResult: (value: T) => void): void;
  cancel(): void;
};

export function createLatestTaskScheduler(delayMs: number): LatestTaskScheduler {
  let version = 0;
  let timer: ReturnType<typeof globalThis.setTimeout> | null = null;

  return {
    schedule<T>(task: () => Promise<T>, onResult: (value: T) => void): void {
      const ownVersion = ++version;
      if (timer) globalThis.clearTimeout(timer);
      timer = globalThis.setTimeout(() => {
        timer = null;
        task().then((value) => {
          if (ownVersion === version) onResult(value);
        });
      }, delayMs);
    },

    cancel(): void {
      version++;
      if (timer) {
        globalThis.clearTimeout(timer);
        timer = null;
      }
    },
  };
}
