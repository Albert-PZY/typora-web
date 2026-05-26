import { readFileSync } from "node:fs";

import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

describe("website entry", () => {
  test("lazy-loads the specs route instead of importing it eagerly", () => {
    const source = readFileSync("website/main.ts", "utf8");

    expect(source).not.toMatch(/import\s+\{\s*specsRoute\s*\}\s+from\s+["']\.\/routes\/specs\.ts["']/);
    expect(source).toMatch(/import\(["']\.\/routes\/specs\.ts["']\)/);
  });
});
