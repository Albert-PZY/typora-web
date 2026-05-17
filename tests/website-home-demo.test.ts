import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { getHomeDemoMarkdown } from "../website/demo-content.ts";
import { setLocale } from "../website/i18n.ts";
import { homeRoute } from "../website/routes/home.ts";

describe("website home demo content", () => {
  test("provides localized demo documents that cover completed editor features", () => {
    const en = getHomeDemoMarkdown("en");
    const zh = getHomeDemoMarkdown("zh");

    for (const markdown of [en, zh]) {
      expect(markdown).toContain("```mermaid");
      expect(markdown).toContain("$$");
      expect(markdown).toContain("```ts");
      expect(markdown).toContain("<details>");
      expect(markdown).toContain("- [x]");
      expect(markdown).toContain("[CommonMark");
    }

    expect(en).toContain("# typora-web demo");
    expect(en).toContain("Focus mode");
    expect(en).toContain("| Feature |");
    expect(zh).toContain("# typora-web 中文演示");
    expect(zh).toContain("专注模式");
    expect(zh).toContain("| 功能 |");
  });

  test("mounts the home editor with the current locale demo", () => {
    setLocale("zh");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "typora-web 中文演示",
      );
    } finally {
      cleanup();
      root.remove();
    }
  });

  test("switches untouched demo content when the locale changes", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "typora-web demo",
      );

      setLocale("zh");

      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "typora-web 中文演示",
      );
      expect(root.querySelector(".ProseMirror")?.textContent).not.toContain(
        "typora-web demo",
      );
    } finally {
      cleanup();
      root.remove();
    }
  });
});
