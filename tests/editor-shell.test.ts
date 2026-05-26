import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";
import { setLocale } from "../website/i18n.ts";
import { mountEditorShell } from "../website/editor-shell.ts";

function mountShell(initialContent = "# Title\n\n## Section\n\nBody text") {
  setLocale("en");
  const root = document.createElement("div");
  root.innerHTML = `
    <div class="editor-menu-bar"></div>
    <main class="page-home">
      <aside class="editor-sidebar" aria-hidden="true">
        <div class="editor-sidebar-tabs"></div>
        <div class="editor-sidebar-body"></div>
      </aside>
      <div class="editor-workspace">
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
  const editor = createEditor(host, { initialContent });
  const statusMessages: string[] = [];
  const cleanupShell = mountEditorShell({
    root,
    main,
    editor,
    host,
    setStatus: (key, vars) => statusMessages.push(`${key}:${vars?.name ?? vars?.message ?? ""}`),
  });

  return {
    root,
    main,
    editor,
    statusMessages,
    cleanup: () => {
      cleanupShell();
      editor.destroy();
      root.remove();
    },
  };
}

function clickMenu(root: HTMLElement, label: string): void {
  const button = Array.from(root.querySelectorAll<HTMLButtonElement>(".editor-menu-button"))
    .find((candidate) => candidate.textContent === label);
  expect(button).not.toBeUndefined();
  button!.click();
}

function clickAction(root: HTMLElement, action: string): void {
  const button = root.querySelector<HTMLButtonElement>(`[data-menu-action="${action}"]`);
  expect(button).not.toBeNull();
  button!.click();
}

async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("editor shell controls", () => {
  test("builds a localized Typora-style menu bar", () => {
    const { root, cleanup } = mountShell();

    try {
      expect(Array.from(root.querySelectorAll(".editor-menu-button")).map((button) => (
        button.textContent
      ))).toEqual(["File", "Edit", "Paragraph", "Format", "View"]);

      clickMenu(root, "View");

      const dropdown = root.querySelector<HTMLElement>(".editor-menu-group.open .editor-menu-dropdown");
      expect(dropdown?.hidden).toBe(false);
      expect(Array.from(dropdown?.querySelectorAll("[data-menu-action]") ?? []).map((button) => (
        (button as HTMLButtonElement).dataset.menuAction
      ))).toEqual([
        "sidebar",
        "outline",
        "file-tree",
        "search",
        "source",
        "focus",
        "typewriter",
        "statusbar",
        "fullscreen",
      ]);
    } finally {
      cleanup();
    }
  });

  test("opens and switches the sidebar between file tree and outline", () => {
    const { root, main, cleanup } = mountShell();

    try {
      root.querySelector<HTMLButtonElement>('[data-shell-action="sidebar-toggle"]')?.click();

      expect(main.classList.contains("sidebar-open")).toBe(true);
      expect(root.querySelector<HTMLElement>(".editor-sidebar")?.getAttribute("aria-hidden")).toBe("false");
      expect(root.querySelector(".editor-file-tree")?.textContent).toContain("demo.md");

      root.querySelector<HTMLButtonElement>('[data-sidebar-mode="outline"]')?.click();

      expect(root.querySelector(".editor-outline")?.textContent).toContain("Title");
      expect(root.querySelector(".editor-outline")?.textContent).toContain("Section");
      expect(root.querySelector('[data-menu-action="outline"]')?.classList.contains("checked")).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("opens markdown files from a picked folder tree", async () => {
    const { root, editor, statusMessages, cleanup } = mountShell();
    const previousPicker = window.showDirectoryPicker;
    let written = "";
    window.showDirectoryPicker = async () => ({
      name: "notes",
      async *entries() {
        yield ["draft.md", {
          name: "draft.md",
          async getFile() {
            return new File(["# Draft\n\nLoaded"], "draft.md", { type: "text/markdown" });
          },
          async createWritable() {
            return {
              async write(value: string) {
                written = value;
              },
              async close() {},
            };
          },
        }];
      },
    } as FileSystemDirectoryHandle);

    try {
      clickMenu(root, "File");
      clickAction(root, "open-folder");
      await flushAsync();

      const fileButton = root.querySelector<HTMLButtonElement>("[data-file-path='notes/draft.md']");
      expect(fileButton).not.toBeNull();
      fileButton!.click();
      await flushAsync();

      expect(editor.getMarkdown()).toBe("# Draft\n\nLoaded");
      expect(statusMessages).toContain("home.status.folderOpened:notes");
      expect(statusMessages).toContain("home.status.opened:draft.md");
      expect(root.querySelector<HTMLButtonElement>("[data-file-path='notes/draft.md']")?.classList.contains("active"))
        .toBe(true);

      editor.setMarkdown("# Draft\n\nSaved");
      clickAction(root, "save");
      await flushAsync();

      expect(written).toBe("# Draft\n\nSaved");
      expect(statusMessages).toContain("home.status.saved:draft.md");
    } finally {
      window.showDirectoryPicker = previousPicker;
      cleanup();
    }
  });

  test("clears the active tree file after opening a file outside the tree", async () => {
    const { root, editor, cleanup } = mountShell();
    const previousPicker = window.showDirectoryPicker;
    window.showDirectoryPicker = async () => ({
      name: "notes",
      async *entries() {
        yield ["draft.md", {
          name: "draft.md",
          async getFile() {
            return new File(["# Draft"], "draft.md", { type: "text/markdown" });
          },
        }];
      },
    } as FileSystemDirectoryHandle);
    editor.openMarkdownFile = async () => ({ status: "opened", name: "loose.md" });

    try {
      clickAction(root, "open-folder");
      await flushAsync();
      root.querySelector<HTMLButtonElement>("[data-file-path='notes/draft.md']")?.click();
      await flushAsync();

      expect(root.querySelector<HTMLButtonElement>("[data-file-path='notes/draft.md']")?.classList.contains("active"))
        .toBe(true);

      clickAction(root, "open");
      await flushAsync();

      expect(root.querySelector<HTMLButtonElement>("[data-file-path='notes/draft.md']")?.classList.contains("active"))
        .toBe(false);
    } finally {
      window.showDirectoryPicker = previousPicker;
      cleanup();
    }
  });

  test("jumps to headings from outline buttons", () => {
    const { root, cleanup } = mountShell("# Title\n\n## Section\n\n### Detail");
    const calls: string[] = [];

    try {
      root.querySelector<HTMLButtonElement>('[data-shell-action="sidebar-toggle"]')?.click();
      root.querySelector<HTMLButtonElement>('[data-sidebar-mode="outline"]')?.click();

      const headings = Array.from(root.querySelectorAll<HTMLElement>(
        ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3",
      ));
      headings.forEach((heading, index) => {
        heading.scrollIntoView = ((options?: ScrollIntoViewOptions) => {
          calls.push(`${index}:${options?.block}:${options?.behavior}`);
        }) as HTMLElement["scrollIntoView"];
      });

      const outlineButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-outline-index]"));
      expect(outlineButtons.map((button) => (
        button.querySelector(".outline-text")?.textContent?.trim()
      ))).toEqual(["Title", "Section", "Detail"]);

      outlineButtons[1].click();

      expect(calls).toEqual(["1:start:smooth"]);
      expect(outlineButtons[1].classList.contains("active")).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("tracks the active heading in the outline while scrolling", () => {
    const { root, cleanup } = mountShell("# Title\n\n## Section\n\n### Detail");
    const itemScrolls: string[] = [];

    try {
      root.querySelector<HTMLButtonElement>('[data-shell-action="sidebar-toggle"]')?.click();
      root.querySelector<HTMLButtonElement>('[data-sidebar-mode="outline"]')?.click();

      const headings = Array.from(root.querySelectorAll<HTMLElement>(
        ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3",
      ));
      [-40, 80, 180].forEach((top, index) => {
        headings[index]!.getBoundingClientRect = () => ({ top }) as DOMRect;
      });
      for (const button of root.querySelectorAll<HTMLButtonElement>("[data-outline-index]")) {
        button.scrollIntoView = (() => {
          itemScrolls.push(button.querySelector(".outline-text")?.textContent?.trim() ?? "");
        }) as HTMLElement["scrollIntoView"];
      }

      window.dispatchEvent(new Event("scroll"));

      const active = root.querySelector<HTMLButtonElement>(".outline-item.active .outline-text");
      expect(active?.textContent?.trim()).toBe("Section");
      expect(itemScrolls).toContain("Section");
    } finally {
      cleanup();
    }
  });

  test("tracks status bar stats and closes popovers on outside clicks", () => {
    const { root, cleanup } = mountShell("hello world\nsecond line");

    try {
      const wordButton = root.querySelector<HTMLButtonElement>(".editor-word-count")!;
      const panel = root.querySelector<HTMLElement>(".editor-stats-popover")!;

      expect(wordButton.textContent).toBe("4 words");
      expect(panel.hidden).toBe(true);

      wordButton.click();
      expect(panel.hidden).toBe(false);
      expect(panel.textContent).toContain("Word Count");
      expect(panel.textContent).toContain("lines");

      root.querySelector<HTMLElement>(".editor-statusbar")?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      expect(panel.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      expect(panel.hidden).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("keeps status stats stable when the document has not changed", () => {
    const { root, cleanup } = mountShell("hello world");

    try {
      const wordButton = root.querySelector<HTMLButtonElement>(".editor-word-count")!;
      const panel = root.querySelector<HTMLElement>(".editor-stats-popover")!;
      const originalPanel = panel.innerHTML;

      wordButton.click();
      expect(panel.hidden).toBe(false);
      expect(panel.innerHTML).toBe(originalPanel);
    } finally {
      cleanup();
    }
  });

  test("maps file menu results into status messages", async () => {
    const { root, editor, statusMessages, cleanup } = mountShell();
    const openResults = [
      { status: "opened", name: "note.md" },
      { status: "cancelled" },
      { status: "unsupported" },
      { status: "error", message: "open failed" },
      { status: "error" },
      { status: "mystery" },
    ];
    editor.createMarkdownFile = async () => ({ status: "saved", name: "created.md" });
    editor.openMarkdownFile = async () => openResults.shift() as never;
    editor.saveMarkdownFile = async () => ({ status: "saved", name: "note.md" });
    editor.saveMarkdownFileAs = async () => ({ status: "downloaded", name: "note.md" });

    try {
      clickAction(root, "new");
      await flushAsync();
      for (let i = 0; i < 6; i++) {
        clickAction(root, "open");
        await flushAsync();
      }
      clickAction(root, "save");
      await flushAsync();
      clickAction(root, "save-as");
      await flushAsync();

      expect(statusMessages).toContain("home.status.opened:note.md");
      expect(statusMessages).toContain("home.status.cancelled:");
      expect(statusMessages).toContain("home.status.unsupported:");
      expect(statusMessages).toContain("home.status.error:open failed");
      expect(statusMessages).toContain("home.status.failed:");
      expect(statusMessages).toContain("home.status.error:mystery");
      expect(statusMessages).toContain("home.status.saved:created.md");
      expect(statusMessages).toContain("home.status.saved:note.md");
      expect(statusMessages).toContain("home.status.downloaded:note.md");
    } finally {
      cleanup();
    }
  });

  test("reports folder picker failures and missing tree file handles", async () => {
    const { root, statusMessages, cleanup } = mountShell();
    const previousPicker = window.showDirectoryPicker;

    try {
      window.showDirectoryPicker = undefined;
      clickAction(root, "open-folder");
      await flushAsync();
      expect(statusMessages).toContain("home.status.folderUnsupported:");

      window.showDirectoryPicker = async () => {
        throw new DOMException("cancelled", "AbortError");
      };
      clickAction(root, "open-folder");
      await flushAsync();
      expect(statusMessages).toContain("home.status.cancelled:");

      window.showDirectoryPicker = async () => {
        throw new Error("folder failed");
      };
      clickAction(root, "open-folder");
      await flushAsync();
      expect(statusMessages).toContain("home.status.error:folder failed");

      root.querySelector<HTMLButtonElement>("[data-file-path='typora-web/learn/demo.md']")?.click();
      await flushAsync();
      expect(statusMessages).toContain("home.status.notImplemented:");

      const fakeFile = document.createElement("button");
      fakeFile.dataset.filePath = "missing.md";
      root.querySelector(".editor-sidebar-body")?.append(fakeFile);
      fakeFile.click();
      await flushAsync();
      expect(statusMessages.filter((message) => message === "home.status.notImplemented:").length)
        .toBeGreaterThanOrEqual(2);
    } finally {
      window.showDirectoryPicker = previousPicker;
      cleanup();
    }
  });

  test("runs browser-backed menu actions defensively", async () => {
    const { root, statusMessages, cleanup } = mountShell();
    const previousExec = document.execCommand;
    const previousPrint = window.print;
    const previousOpen = window.open;
    const fullscreenDescriptor = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    const requestDescriptor = Object.getOwnPropertyDescriptor(document.documentElement, "requestFullscreen");
    const exitDescriptor = Object.getOwnPropertyDescriptor(document, "exitFullscreen");
    const execCommands: string[] = [];
    const opened: string[] = [];
    let printed = false;
    let requested = 0;
    let exited = 0;

    document.execCommand = ((command: string) => {
      execCommands.push(command);
      return true;
    }) as typeof document.execCommand;
    window.print = () => { printed = true; };
    window.open = ((url?: string | URL) => {
      opened.push(String(url ?? ""));
      return null;
    }) as typeof window.open;
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: async () => { requested += 1; },
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: async () => { exited += 1; },
    });

    try {
      clickAction(root, "select-all");
      clickAction(root, "undo");
      clickAction(root, "new-window");
      clickAction(root, "print");

      Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
      clickAction(root, "fullscreen");
      await flushAsync();
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: document.documentElement,
      });
      clickAction(root, "fullscreen");
      await flushAsync();

      clickAction(root, "search");

      expect(execCommands).toEqual(["selectAll", "undo"]);
      expect(opened).toEqual([window.location.href]);
      expect(printed).toBe(true);
      expect(requested).toBe(1);
      expect(exited).toBe(1);
      expect(statusMessages).toContain("home.status.notImplemented:");
    } finally {
      document.execCommand = previousExec;
      window.print = previousPrint;
      window.open = previousOpen;
      if (fullscreenDescriptor) {
        Object.defineProperty(document, "fullscreenElement", fullscreenDescriptor);
      } else {
        delete (document as unknown as Record<string, unknown>).fullscreenElement;
      }
      if (requestDescriptor) {
        Object.defineProperty(document.documentElement, "requestFullscreen", requestDescriptor);
      } else {
        delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
      }
      if (exitDescriptor) {
        Object.defineProperty(document, "exitFullscreen", exitDescriptor);
      } else {
        delete (document as unknown as Record<string, unknown>).exitFullscreen;
      }
      cleanup();
    }
  });

  test("refreshes dynamic shell labels when the locale changes", () => {
    const { root, cleanup } = mountShell("hello");

    try {
      expect(root.querySelector<HTMLButtonElement>(".editor-word-count")?.textContent).toBe("1 words");

      setLocale("zh");

      expect(Array.from(root.querySelectorAll(".editor-menu-button")).map((button) => (
        button.textContent
      ))).toEqual(["文件", "编辑", "段落", "格式", "视图"]);
      expect(root.querySelector<HTMLButtonElement>(".editor-word-count")?.textContent).toBe("1 词");
    } finally {
      cleanup();
      setLocale("en");
    }
  });

  test("handles shell shortcuts without treating editor formatting keys as shell commands", () => {
    const { root, editor, cleanup } = mountShell();

    try {
      editor.focus();
      const proseMirror = root.querySelector(".ProseMirror")!;
      const bold = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      proseMirror.dispatchEvent(bold);
      expect(root.querySelector<HTMLElement>(".editor-sidebar")?.getAttribute("aria-hidden")).toBe("true");
      expect(editor.isSourceMode()).toBe(false);

      const outline = new KeyboardEvent("keydown", {
        key: "!",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      proseMirror.dispatchEvent(outline);

      expect(outline.defaultPrevented).toBe(true);
      expect(root.querySelector<HTMLElement>(".editor-sidebar")?.getAttribute("aria-hidden")).toBe("false");
      expect(root.querySelector(".editor-outline")?.textContent).toContain("Title");
    } finally {
      cleanup();
    }
  });

  test("applies low-risk paragraph menu commands through ProseMirror", () => {
    const { root, editor, cleanup } = mountShell("Body text");

    try {
      clickAction(root, "heading-2");
      expect(editor.getMarkdown()).toBe("## Body text");

      clickAction(root, "paragraph");
      expect(editor.getMarkdown()).toBe("Body text");

      clickAction(root, "heading-1");
      expect(editor.getMarkdown()).toBe("# Body text");

      clickAction(root, "heading-3");
      expect(editor.getMarkdown()).toBe("### Body text");
    } finally {
      cleanup();
    }
  });

  test("toggles source, focus, typewriter, and status bar menu checks", () => {
    const { root, editor, cleanup } = mountShell();

    try {
      clickMenu(root, "View");
      clickAction(root, "source");
      expect(editor.isSourceMode()).toBe(true);
      expect(root.querySelector('[data-shell-action="source"]')?.classList.contains("active")).toBe(true);

      root.querySelector<HTMLButtonElement>('[data-shell-action="source"]')?.click();
      expect(editor.isSourceMode()).toBe(false);

      root.querySelector(".ProseMirror")?.dispatchEvent(new KeyboardEvent("keydown", {
        key: "/",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }));
      expect(editor.isSourceMode()).toBe(true);
      expect(root.querySelector('[data-shell-action="source"]')?.classList.contains("active")).toBe(true);
      root.querySelector<HTMLButtonElement>('[data-shell-action="source"]')?.click();

      clickMenu(root, "View");
      clickAction(root, "focus");
      clickMenu(root, "View");
      clickAction(root, "typewriter");

      expect(editor.isFocusMode()).toBe(true);
      expect(editor.isTypewriterMode()).toBe(true);
      expect(root.querySelector('[data-menu-action="focus"]')?.classList.contains("checked")).toBe(true);
      expect(root.querySelector('[data-menu-action="typewriter"]')?.classList.contains("checked")).toBe(true);

      clickAction(root, "statusbar");
      expect(root.querySelector<HTMLElement>(".editor-statusbar")?.hidden).toBe(true);
    } finally {
      cleanup();
    }
  });
});
