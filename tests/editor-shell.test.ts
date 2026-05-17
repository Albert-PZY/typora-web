import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";
import { setLocale } from "../website/i18n.ts";
import { mountEditorShell } from "../website/editor-shell.ts";

function mountShell() {
  setLocale("en");
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="editor-menu-bar"></div>
    <main class="page-home">
      <div class="editor-workspace">
        <aside class="editor-sidebar" hidden>
          <div class="editor-sidebar-tabs"></div>
          <div class="editor-sidebar-body"></div>
        </aside>
        <section class="hero-editor"></section>
      </div>
      <footer class="editor-statusbar">
        <div class="editor-statusbar-left">
          <button type="button" data-shell-action="sidebar-toggle"></button>
          <button type="button" data-shell-action="source"></button>
        </div>
        <span class="editor-toolbar-status"></span>
        <div class="editor-statusbar-right">
          <button type="button" class="editor-word-count"></button>
          <div class="editor-stats-popover" hidden></div>
        </div>
      </footer>
    </main>
  `;
  document.body.append(root);
  const main = root.querySelector<HTMLElement>(".page-home")!;
  const host = root.querySelector<HTMLElement>(".hero-editor")!;
  const editor = createEditor(host, { initialContent: "# Title\n\nBody text" });
  const cleanupShell = mountEditorShell({
    root,
    main,
    editor,
    host,
    getStatus: () => "",
    setStatus: () => {},
  });
  return {
    root,
    editor,
    cleanup: () => {
      cleanupShell();
      editor.destroy();
      root.remove();
    },
  };
}

describe("editor shell controls", () => {
  test("prevents browser defaults without blocking editor shortcuts", () => {
    const { root, editor, cleanup } = mountShell();

    try {
      editor.focus();
      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      root.querySelector(".ProseMirror")?.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("supports Typora sidebar shortcuts without browser interference", () => {
    const { root, editor, cleanup } = mountShell();

    try {
      editor.focus();
      const event = new KeyboardEvent("keydown", {
        key: "1",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      root.querySelector(".ProseMirror")?.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(root.querySelector<HTMLElement>(".editor-sidebar")?.hidden).toBe(false);
      expect(root.querySelector(".editor-outline")?.textContent).toContain("Title");
    } finally {
      cleanup();
    }
  });
});
