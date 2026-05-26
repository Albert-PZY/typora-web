import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { runFeatureCases } from "../utils.ts";
import { createEditor, type Editor } from "../../src/lib.ts";
import { emojiSpecs } from "../../specs/features/emoji.specs.ts";

runFeatureCases(emojiSpecs);

function createHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

function typeText(editor: Editor, text: string): void {
  editor.view.dispatch(editor.view.state.tr.insertText(text));
}

function press(editor: Editor, key: string): void {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

describe("emoji autocomplete", () => {
  test("commits a clicked autocomplete row as source text plus trailing space", () => {
    const host = createHost();
    const editor = createEditor(host);

    try {
      typeText(editor, ":roc");

      const popup = host.querySelector<HTMLElement>(".emoji-completion");
      const rocket = popup?.querySelector<HTMLElement>("[data-name='rocket']");
      expect(popup).not.toBeNull();
      expect(rocket).not.toBeNull();

      rocket!.click();

      expect(editor.getMarkdown()).toBe(":rocket: ");
      expect(host.querySelector(".emoji-completion")).toBeNull();
      expect(host.querySelector(".emoji-glyph")?.textContent).toBe("🚀");
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("keyboard selection clamps and Enter commits the selected emoji", () => {
    const host = createHost();
    const editor = createEditor(host);

    try {
      typeText(editor, ":smil");

      for (let i = 0; i < 20; i++) press(editor, "ArrowDown");
      for (let i = 0; i < 20; i++) press(editor, "ArrowUp");
      press(editor, "Enter");

      expect(editor.getMarkdown()).toBe(":smile: ");
      expect(host.querySelector(".emoji-completion")).toBeNull();
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("Escape dismisses the same partial until the text changes", () => {
    const host = createHost();
    const editor = createEditor(host);

    try {
      typeText(editor, ":smi");
      expect(host.querySelector(".emoji-completion")).not.toBeNull();

      press(editor, "Escape");
      expect(host.querySelector(".emoji-completion")).toBeNull();

      editor.view.dispatch(editor.view.state.tr.setMeta("emoji-test-refresh", true));
      expect(host.querySelector(".emoji-completion")).toBeNull();

      typeText(editor, "l");
      expect(host.querySelector(".emoji-completion")).not.toBeNull();
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("clicking a rendered glyph moves the cursor to the source tail", () => {
    const host = createHost();
    const editor = createEditor(host, { initialContent: ":rocket: ships" });

    try {
      const glyph = host.querySelector<HTMLElement>(".emoji-glyph");
      expect(glyph).not.toBeNull();

      glyph!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      const selection = editor.view.state.selection;
      expect(selection.empty).toBe(true);
      expect(selection.from).toBe(9);
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
