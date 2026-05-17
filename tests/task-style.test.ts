import { readFileSync } from "node:fs";

import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

describe("task list styling", () => {
  test("task list items hide the unordered bullet marker when a checkbox is present", () => {
    const widgetsCss = readFileSync("src/styles/widgets.css", "utf8");

    expect(widgetsCss).toContain(".ProseMirror li:has(> p > .checkbox-frame:first-child)");
    expect(widgetsCss).toContain("list-style-type: none;");
  });
});
