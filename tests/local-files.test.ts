import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";

describe("local markdown files", () => {
  test("opens a Markdown file through File System Access API", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host);
    const handle = {
      name: "note.md",
      async getFile() {
        return new File(["# Note"], "note.md", { type: "text/markdown" });
      },
    };
    const oldPicker = window.showOpenFilePicker;
    window.showOpenFilePicker = async () => [handle as FileSystemFileHandle];
    try {
      const result = await editor.openMarkdownFile();
      expect(result.status).toBe("opened");
      expect(editor.getMarkdown()).toBe("# Note");
      expect(editor.getCurrentFileName()).toBe("note.md");
    } finally {
      window.showOpenFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("returns cancelled when opening is aborted", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "unchanged" });
    const oldPicker = window.showOpenFilePicker;
    window.showOpenFilePicker = async () => {
      throw new DOMException("cancelled", "AbortError");
    };
    try {
      const result = await editor.openMarkdownFile();
      expect(result.status).toBe("cancelled");
      expect(editor.getMarkdown()).toBe("unchanged");
    } finally {
      window.showOpenFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("opens Markdown through a file input fallback when File System Access API is unavailable", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host);
    const oldPicker = window.showOpenFilePicker;
    const oldClick = HTMLInputElement.prototype.click;
    window.showOpenFilePicker = undefined;
    HTMLInputElement.prototype.click = function click() {
      Object.defineProperty(this, "files", {
        configurable: true,
        value: [new File(["# Fallback"], "fallback.md", { type: "text/markdown" })],
      });
      this.dispatchEvent(new Event("change"));
    };
    try {
      const result = await editor.openMarkdownFile();
      expect(result.status).toBe("opened");
      if (result.status !== "opened") throw new Error("expected fallback open success");
      expect(result.name).toBe("fallback.md");
      expect(editor.getMarkdown()).toBe("# Fallback");
    } finally {
      HTMLInputElement.prototype.click = oldClick;
      window.showOpenFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("returns cancelled when the file input fallback has no file", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host);
    const oldPicker = window.showOpenFilePicker;
    const oldClick = HTMLInputElement.prototype.click;
    window.showOpenFilePicker = undefined;
    HTMLInputElement.prototype.click = function click() {
      Object.defineProperty(this, "files", { configurable: true, value: [] });
      this.dispatchEvent(new Event("change"));
    };
    try {
      const result = await editor.openMarkdownFile();
      expect(result.status).toBe("cancelled");
    } finally {
      HTMLInputElement.prototype.click = oldClick;
      window.showOpenFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("saves Markdown through the current file handle", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "draft" });
    let written = "";
    const handle = {
      name: "draft.md",
      async getFile() {
        return new File(["draft"], "draft.md", { type: "text/markdown" });
      },
      async createWritable() {
        return {
          async write(value: string) {
            written = value;
          },
          async close() {},
        };
      },
    };
    const oldPicker = window.showOpenFilePicker;
    window.showOpenFilePicker = async () => [handle as FileSystemFileHandle];
    try {
      await editor.openMarkdownFile();
      editor.setMarkdown("changed");
      const result = await editor.saveMarkdownFile();
      expect(result.status).toBe("saved");
      expect(written).toBe("changed");
    } finally {
      window.showOpenFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("save as falls back to a Markdown download when Save File Picker is unavailable", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "download me" });
    const oldPicker = window.showSaveFilePicker;
    const oldCreate = URL.createObjectURL;
    const oldRevoke = URL.revokeObjectURL;
    const oldClick = HTMLAnchorElement.prototype.click;
    let clickedName = "";
    window.showSaveFilePicker = undefined;
    URL.createObjectURL = (() => "blob:typora-web-test") as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    HTMLAnchorElement.prototype.click = function click() {
      clickedName = this.download;
    };
    try {
      const result = await editor.saveMarkdownFileAs();
      expect(result.status).toBe("downloaded");
      expect(clickedName).toBe("untitled.md");
    } finally {
      HTMLAnchorElement.prototype.click = oldClick;
      URL.revokeObjectURL = oldRevoke;
      URL.createObjectURL = oldCreate;
      window.showSaveFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });

  test("returns cancelled when Save As is aborted", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "draft" });
    const oldPicker = window.showSaveFilePicker;
    window.showSaveFilePicker = async () => {
      throw new DOMException("cancelled", "AbortError");
    };
    try {
      const result = await editor.saveMarkdownFileAs();
      expect(result.status).toBe("cancelled");
    } finally {
      window.showSaveFilePicker = oldPicker;
      editor.destroy();
      host.remove();
    }
  });
});
