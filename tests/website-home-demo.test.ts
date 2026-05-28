import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { getHomeDemoMarkdown, MERMAID_DEMO_COUNT } from "../website/demo-content.ts";
import { setLocale } from "../website/i18n.ts";
import { homeRoute, shouldSwitchHomeDemoLocale } from "../website/routes/home.ts";

describe("website home demo content", () => {
  test("provides localized demo documents that cover completed editor features", () => {
    const en = getHomeDemoMarkdown("en");
    const zh = getHomeDemoMarkdown("zh");

    for (const markdown of [en, zh]) {
      expect(markdown).toContain("```mermaid");
      expect(markdown).toContain("$$");
      expect(markdown).toContain("```ts");
      expect(markdown).toContain("<details>");
      expect(markdown).toContain("<!--");
      expect(markdown).toContain("---");
      expect(markdown).toContain("<u>");
      expect(markdown).toContain("![");
      expect(markdown).toContain('<img src="favicon.svg"');
      expect(markdown).toContain('width="96"');
      expect(markdown).toContain("<https://example.com>");
      expect(markdown).toContain("<hello@example.com>");
      expect(markdown).toContain("> [!NOTE]");
      expect(markdown).toContain("> [!TIP]");
      expect(markdown).toContain("> [!IMPORTANT]");
      expect(markdown).toContain("> [!WARNING]");
      expect(markdown).toContain("> [!DANGER]");
      expect(markdown).not.toContain("> [!CAUTION]");
      expect(markdown).toContain("1. ");
      expect(markdown).toContain("|:---|:---:|---:|");
      expect(markdown).toContain("- [x]");
      expect(markdown).toContain("[CommonMark");
    }

    expect(en).toContain("# Typora-Web demo");
    expect(en).toContain("focus mode");
    expect(en).toContain("| Syntax |");
    expect(zh).toContain("# Typora-Web 中文演示");
    expect(zh).toContain("专注模式");
    expect(zh).toContain("| 语法 |");
  });

  test("covers every supported Mermaid diagram family in the localized demo", () => {
    const en = getHomeDemoMarkdown("en");
    const zh = getHomeDemoMarkdown("zh");
    const requiredMermaidStarts = [
      "flowchart LR",
      "graph TD",
      "flowchart-elk TD",
      "sequenceDiagram",
      "classDiagram",
      "classDiagram-v2",
      "stateDiagram",
      "stateDiagram-v2",
      "erDiagram",
      "journey",
      "gantt",
      "info",
      "pie showData",
      "quadrantChart",
      "requirementDiagram",
      "gitGraph",
      "C4Context",
      "mindmap",
      "timeline",
      "xychart-beta",
      "sankey-beta",
      "packet-beta",
      "block-beta",
      "kanban",
      "architecture-beta",
      "radar-beta",
      "treeView-beta",
      "eventmodeling",
      "ishikawa-beta",
      "venn-beta",
      "treemap-beta",
      "wardley-beta",
    ];

    for (const markdown of [en, zh]) {
      expect(markdown.match(/```mermaid/g)?.length).toBe(MERMAID_DEMO_COUNT);
      for (const start of requiredMermaidStarts) {
        expect(markdown).toContain(start);
      }
    }

    expect(en).toContain("A[Markdown source] --> B[Live preview]");
    expect(en).toContain("U->>E: Type Markdown");
    expect(en).toContain("title \"Render budget\"");
    expect(en).toContain("set B[\"Preview\"]:35");
    expect(zh).toContain("A[Markdown 源码] --> B[实时预览]");
    expect(zh).toContain("U->>E: 输入 Markdown");
    expect(zh).toContain("title \"渲染预算\"");
    expect(zh).toContain("set B[\"预览\"]:35");
  });

  test("mounts the home editor with the current locale demo", () => {
    setLocale("zh");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "Typora-Web 中文演示",
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

      expect(en).toBe("# Typora-Web demo\n\nMinimal debug content.");
      expect(zh).toBe("# Typora-Web 中文演示\n\n最小化调试内容。");
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
        "Typora-Web demo",
      );

      setLocale("zh");

      expect(root.querySelector(".ProseMirror")?.textContent).toContain(
        "Typora-Web 中文演示",
      );
      expect(root.querySelector(".ProseMirror")?.textContent).not.toContain(
        "Typora-Web demo",
      );
    } finally {
      cleanup();
      root.remove();
    }
  });

  test("keeps demo content after the user starts editing", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      root.querySelector(".hero-editor")?.dispatchEvent(new InputEvent("beforeinput", {
        bubbles: true,
        inputType: "insertText",
        data: "x",
      }));
      setLocale("zh");

      expect(root.querySelector(".ProseMirror")?.textContent).toContain("Typora-Web demo");
      expect(root.querySelector(".ProseMirror")?.textContent).not.toContain(
        "Typora-Web 中文演示",
      );
    } finally {
      cleanup();
      root.remove();
    }
  });

  test("keeps edited demo content when the locale changes", () => {
    expect(shouldSwitchHomeDemoLocale({
      currentLocale: "en",
      nextLocale: "zh",
      currentMarkdown: "edited",
      lastDemoMarkdown: "edited",
      touched: true,
    })).toBe(false);
    expect(shouldSwitchHomeDemoLocale({
      currentLocale: "en",
      nextLocale: "zh",
      currentMarkdown: "external file",
      lastDemoMarkdown: getHomeDemoMarkdown("en"),
      touched: false,
    })).toBe(false);
    expect(shouldSwitchHomeDemoLocale({
      currentLocale: "en",
      nextLocale: "zh",
      currentMarkdown: getHomeDemoMarkdown("en"),
      lastDemoMarkdown: getHomeDemoMarkdown("en"),
      touched: false,
    })).toBe(true);
  });

  test("mounts the Typora-style shell around the home editor", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      const menuBar = root.querySelector<HTMLElement>(".editor-menu-bar");
      const nav = root.querySelector<HTMLElement>(".site-nav");
      const brand = root.querySelector<HTMLElement>(".brand");
      const navLinks = Array.from(root.querySelectorAll<HTMLElement>(".nav-links [data-route]"));
      const editorLink = root.querySelector<HTMLAnchorElement>('[data-route="/"]');
      const sidebar = root.querySelector<HTMLElement>(".editor-sidebar");
      const workspace = root.querySelector<HTMLElement>(".editor-workspace");
      const statusbar = root.querySelector<HTMLElement>(".editor-statusbar");

      expect(navLinks.map((link) => link.textContent)).toEqual(["Specs", "Editor"]);
      expect(brand?.textContent).toBe("Typora-Web");
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
      expect(root.querySelector(".editor-file-tree")?.textContent).toContain("Typora-Web");
      expect(root.querySelector(".editor-file-tree")?.textContent).toContain("demo.md");
    } finally {
      cleanup();
      root.remove();
    }
  });

  test("shows shell status messages from home route actions", () => {
    setLocale("en");
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      const menuBar = root.querySelector<HTMLElement>(".editor-menu-bar");
      const action = document.createElement("button");
      action.type = "button";
      action.dataset.menuAction = "unknown";
      menuBar?.append(action);

      action.click();

      expect(root.querySelector(".editor-toolbar-status")?.textContent).toBe(
        "This menu item is a compatibility placeholder",
      );
    } finally {
      cleanup();
      root.remove();
    }
  });
});
