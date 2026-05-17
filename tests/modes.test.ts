import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";

describe("editor modes", () => {
  test("focus mode toggles through the controller", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      expect(editor.isFocusMode()).toBe(false);
      editor.setFocusMode(true);
      expect(editor.isFocusMode()).toBe(true);
      expect(host.querySelector(".typora-web-wrap")?.classList.contains("tw-focus-mode")).toBe(true);
      editor.toggleFocusMode();
      expect(editor.isFocusMode()).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("focus mode toggles with F8 and marks active and muted blocks", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "F8", bubbles: true }));

      expect(editor.isFocusMode()).toBe(true);
      expect(host.querySelector(".tw-focus-active")).not.toBeNull();
      expect(host.querySelector(".tw-focus-muted")).not.toBeNull();
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("typewriter mode toggles through the controller", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one\n\ntwo" });
    try {
      expect(editor.isTypewriterMode()).toBe(false);
      editor.setTypewriterMode(true);
      expect(editor.isTypewriterMode()).toBe(true);
      expect(host.querySelector(".typora-web-wrap")?.classList.contains("tw-typewriter-mode")).toBe(true);
      editor.toggleTypewriterMode();
      expect(editor.isTypewriterMode()).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("typewriter mode toggles with F9 and requests cursor centering", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "one" });
    const oldScrollTo = window.scrollTo;
    const oldCoordsAtPos = editor.view.coordsAtPos;
    let scrollCalls = 0;
    try {
      window.scrollTo = (() => {
        scrollCalls++;
      }) as typeof window.scrollTo;
      editor.view.coordsAtPos = (() => ({
        top: 480,
        bottom: 500,
        left: 0,
        right: 0,
      })) as typeof editor.view.coordsAtPos;

      editor.view.dom.dispatchEvent(new KeyboardEvent("keydown", { key: "F9", bubbles: true }));

      expect(editor.isTypewriterMode()).toBe(true);
      expect(scrollCalls).toBe(1);
    } finally {
      editor.view.coordsAtPos = oldCoordsAtPos;
      window.scrollTo = oldScrollTo;
      editor.destroy();
      host.remove();
    }
  });

  test("source mode toggle preserves the current page scroll position", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: Array.from({ length: 20 }, (_, i) => `paragraph ${i + 1}`).join("\n\n"),
    });
    const oldScrollTo = window.scrollTo;
    const oldScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
    const calls: number[] = [];

    try {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 320 });
      window.scrollTo = ((arg: ScrollToOptions | number) => {
        calls.push(typeof arg === "number" ? arg : Number(arg.top ?? 0));
      }) as typeof window.scrollTo;

      editor.toggleSource();
      editor.toggleSource();

      expect(calls).toContain(320);
      expect(calls[calls.length - 1]).toBe(320);
    } finally {
      window.scrollTo = oldScrollTo;
      if (oldScrollY) Object.defineProperty(window, "scrollY", oldScrollY);
      editor.destroy();
      host.remove();
    }
  });

  test("Ctrl+/ toggles source mode without invoking CodeMirror line comments", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const markdown = [
      "# typora-web 中文演示",
      "",
      "- [x] 使用 `F8` 切换**专注模式**，使用 `F9` 切换**打字机模式**。",
    ].join("\n");
    const editor = createEditor(host, { initialContent: markdown });

    try {
      editor.toggleSource();
      const sourceContent = host.querySelector<HTMLElement>(".typora-web-source-editor .cm-content");
      sourceContent?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "/",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(editor.isSourceMode()).toBe(false);
      expect(editor.getMarkdown()).not.toContain("<!--");
      expect(editor.getMarkdown()).not.toContain("-->");
      expect(editor.getMarkdown()).toContain("`F8`");
      expect(editor.getMarkdown()).toContain("**专注模式**");
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("repeated Ctrl+/ toggles preserve task markers and inline source delimiters", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const markdown = [
      "## 编辑流程",
      "",
      "- [x] 通过工具栏打开和保存本地 `.md` 文件。",
      "- [x] 使用 `Shift-Enter` 插入硬换行，并留在当前段落中继续输入。",
      "- [x] 使用 `F8` 切换**专注模式**，使用 `F9` 切换**打字机模式**。",
      "- [x] 使用 `Mod-b`、`Mod-i`、`Mod-k`、`Mod-Shift-7`、`Mod-Shift-8` 等常见快捷键。",
      "",
      "> 当光标离开源码标记时，标记会弱化显示，但 Markdown 源码仍然可编辑。",
    ].join("\n");
    const editor = createEditor(host, { initialContent: markdown });

    try {
      for (let i = 0; i < 8; i++) {
        const target = editor.isSourceMode()
          ? host.querySelector<HTMLElement>(".typora-web-source-editor .cm-content")
          : editor.view.dom;
        expect(target).not.toBeNull();
        target!.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "/",
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        await Promise.resolve();
      }

      const roundTripped = editor.getMarkdown();
      expect(roundTripped.trimEnd()).toBe(markdown);
      expect(roundTripped).not.toContain("\\[x\\]");
      expect(roundTripped).not.toContain("\\`F8\\`");
      expect(roundTripped).not.toContain("\\**专注模式\\**");
      expect(host.querySelectorAll(".checkbox[data-checked='1']").length).toBe(4);
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
