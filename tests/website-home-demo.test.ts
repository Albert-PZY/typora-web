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

  test("uses minimal demo content when the debug query is enabled", () => {
    const previousUrl = location.href;
    history.replaceState(null, "", "/?minimal=1");

    try {
      const en = getHomeDemoMarkdown("en");
      const zh = getHomeDemoMarkdown("zh");

      expect(en).toBe("# typora-web demo\n\nMinimal debug content.");
      expect(zh).toBe("# typora-web 中文演示\n\n最小化调试内容。");
      expect(en).not.toContain("```mermaid");
      expect(zh).not.toContain("```mermaid");
    } finally {
      history.replaceState(null, "", previousUrl);
    }
  });

  test("mounts the home editor with minimal debug content", () => {
    const previousUrl = location.href;
    history.replaceState(null, "", "/?minimal=1");
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "Minimal debug content.",
      );
      expect(root.querySelector(".ProseMirror")?.textContent).not.toContain(
        "Mermaid",
      );
    } finally {
      cleanup();
      root.remove();
      history.replaceState(null, "", previousUrl);
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

  test("mounts the Typora-style shell around the home editor", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      const menuBar = root.querySelector<HTMLElement>(".editor-menu-bar");
      const nav = root.querySelector<HTMLElement>(".site-nav");
      const navLinks = Array.from(root.querySelectorAll<HTMLElement>(".nav-links [data-route]"));
      const editorLink = root.querySelector<HTMLAnchorElement>('[data-route="/"]');
      const sidebar = root.querySelector<HTMLElement>(".editor-sidebar");
      const workspace = root.querySelector<HTMLElement>(".editor-workspace");
      const statusbar = root.querySelector<HTMLElement>(".editor-statusbar");

      expect(navLinks.map((link) => link.textContent)).toEqual(["Specs", "Editor"]);
      expect(menuBar?.closest(".site-nav")).toBe(nav);
      expect(editorLink?.nextElementSibling).toBe(menuBar);
      expect(root.querySelector("main > .editor-menu-bar")).toBeNull();
      expect(menuBar?.getAttribute("aria-label")).toBe("Editor tools");
      expect(Array.from(menuBar?.querySelectorAll(".editor-menu-button") ?? []).map((button) => (
        button.textContent
      ))).toEqual(["File", "Edit", "Paragraph", "Format", "View"]);
      expect(sidebar?.closest(".editor-workspace")).toBeNull();
      expect(workspace?.querySelector(".editor-sidebar")).toBeNull();
      expect(sidebar?.getAttribute("aria-hidden")).toBe("true");
      expect(statusbar?.hidden).toBe(false);

      root.querySelector<HTMLButtonElement>('[data-shell-action="sidebar-toggle"]')?.click();

      expect(sidebar?.getAttribute("aria-hidden")).toBe("false");
      expect(root.querySelector(".page-home")?.classList.contains("sidebar-open")).toBe(true);
      expect(root.querySelector(".editor-file-tree")?.textContent).toContain("demo.md");
    } finally {
      cleanup();
      root.remove();
    }
  });
});
