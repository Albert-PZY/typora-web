import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { TextSelection } from "prosemirror-state";

import { createEditor } from "../src/lib.ts";
import { renderMathToHtml } from "../src/renderers/math.ts";

describe("math renderer", () => {
  test("renders inline TeX with KaTeX markup", () => {
    const result = renderMathToHtml("E=mc^2", false);
    expect(result.ok).toBe(true);
    expect(result.html).toContain("katex");
    expect(result.html).toContain("math");
  });

  test("contains invalid TeX as an error result without throwing", () => {
    const result = renderMathToHtml("\\notacommand{", true);
    expect(result.ok).toBe(false);
    expect(result.html).toContain("math-error");
    expect(result.html).toContain("\\notacommand{");
  });

  test("clicking block math preview opens source and outside click hides it", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "$$\nE=mc^2\n$$",
    });

    try {
      const block = host.querySelector<HTMLElement>("math-block");
      const source = host.querySelector<HTMLElement>("math-source");
      const preview = host.querySelector<HTMLElement>("math-preview");

      expect(block).not.toBeNull();
      expect(source?.hidden).toBe(true);
      preview?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(block?.classList.contains("math-source-open")).toBe(true);
      expect(source?.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(block?.classList.contains("math-source-open")).toBe(false);
      expect(source?.hidden).toBe(true);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("mousedown on rendered block math opens source before the document outside handler can hide it", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "$$\nE=mc^2\n$$",
    });

    try {
      const block = host.querySelector<HTMLElement>("math-block");
      const source = host.querySelector<HTMLElement>("math-source");
      const preview = host.querySelector<HTMLElement>("math-preview");
      const renderedChild = preview?.querySelector<HTMLElement>(".katex *") ?? preview;

      expect(source?.hidden).toBe(true);
      renderedChild?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );

      expect(block?.classList.contains("math-source-open")).toBe(true);
      expect(source?.hidden).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("clicking KaTeX output opens block source and moves the editor selection into it", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "before\n\n$$\nE=mc^2\n$$\n\nafter",
    });

    try {
      editor.view.dispatch(
        editor.view.state.tr.setSelection(TextSelection.atEnd(editor.view.state.doc)),
      );
      expect(editor.view.state.selection.$from.parent.type.name).toBe("paragraph");

      const block = host.querySelector<HTMLElement>("math-block");
      const source = host.querySelector<HTMLElement>("math-source");
      const preview = host.querySelector<HTMLElement>("math-preview");
      const renderedChild = preview?.querySelector<HTMLElement>(".katex *") ?? preview;

      expect(block).not.toBeNull();
      expect(source?.hidden).toBe(true);
      renderedChild?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      renderedChild?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(block?.classList.contains("math-source-open")).toBe(true);
      expect(source?.hidden).toBe(false);
      expect(editor.view.state.selection.$from.parent.type.name).toBe("math_block");
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
