import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createLatestTaskScheduler } from "../src/renderers/latest-task.ts";

const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

describe("latest task scheduler", () => {
  test("runs only the latest task after the debounce window", async () => {
    const calls: string[] = [];
    const scheduler = createLatestTaskScheduler(5);

    scheduler.schedule(
      async () => {
        calls.push("old task");
        return "old";
      },
      (value) => calls.push(`${value} result`),
    );
    scheduler.schedule(
      async () => {
        calls.push("new task");
        return "new";
      },
      (value) => calls.push(`${value} result`),
    );

    await wait(20);

    expect(calls).toEqual(["new task", "new result"]);
  });

  test("ignores stale async results after a newer task is scheduled", async () => {
    const calls: string[] = [];
    const scheduler = createLatestTaskScheduler(0);

    scheduler.schedule(
      async () => {
        calls.push("slow task");
        await wait(20);
        return "slow";
      },
      (value) => calls.push(`${value} result`),
    );
    await wait(1);
    scheduler.schedule(
      async () => {
        calls.push("fast task");
        return "fast";
      },
      (value) => calls.push(`${value} result`),
    );

    await wait(40);

    expect(calls).toEqual(["slow task", "fast task", "fast result"]);
  });
});
