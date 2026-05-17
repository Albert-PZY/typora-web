import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { getEditorStats } from "../website/editor-stats.ts";

describe("editor status statistics", () => {
  test("counts words, lines, characters, and reading time for mixed Markdown", () => {
    const stats = getEditorStats("# 标题\nHello typora web\n第二行");

    expect(stats.lines).toBe(3);
    expect(stats.words).toBeGreaterThanOrEqual(8);
    expect(stats.characters).toBeGreaterThan(10);
    expect(stats.readingMinutes).toBe(1);
  });
});
