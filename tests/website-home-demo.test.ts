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

  test("renders Typora-like menu bar, sidebar, and status bar chrome", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      const navLinks = Array.from(root.querySelectorAll(".nav-links a")).map((link) => (
        link.textContent?.trim()
      ));
      const menuButtons = Array.from(root.querySelectorAll(".editor-menu-button")).map((button) => (
        button.textContent?.trim()
      ));
      const fileButton = root.querySelector<HTMLButtonElement>('[data-menu="file"]');
      const statusbar = root.querySelector<HTMLElement>(".editor-statusbar");
      const sidebar = root.querySelector<HTMLElement>(".editor-sidebar");

      expect(navLinks).toEqual(["Specs", "Editor"]);
      expect(menuButtons).toEqual(["File", "Edit", "Paragraph", "Format", "View"]);
      expect(statusbar).not.toBeNull();
      expect(sidebar?.hidden).toBe(true);

      fileButton?.click();

      const fileActions = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-menu-action]'),
      ).map((button) => button.dataset.menuAction);
      expect(fileActions).toContain("open-folder");
      expect(fileActions).toContain("save-as");

      root.querySelector<HTMLButtonElement>('[data-menu-action="file-tree"]')?.click();
      expect(sidebar?.hidden).toBe(false);
      expect(root.querySelector(".editor-file-tree")?.textContent).toContain("demo.md");

      root.querySelector<HTMLButtonElement>('[data-menu-action="outline"]')?.click();
      expect(root.querySelector(".editor-outline")?.textContent).toContain("typora-web demo");

      root.querySelector<HTMLButtonElement>(".editor-word-count")?.click();
      expect(root.querySelector<HTMLElement>(".editor-stats-popover")?.hidden).toBe(false);
      expect(root.querySelector(".editor-stats-popover")?.textContent).toContain("Word Count");
    } finally {
      cleanup();
      root.remove();
    }
  });
});
