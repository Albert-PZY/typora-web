import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

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

  test("block math keeps source visible beside the rendered preview", () => {
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
      expect(source?.hidden).toBe(false);
      expect(source?.textContent).toBe("E=mc^2");
      expect(preview?.querySelector(".katex")).not.toBeNull();
      preview?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(block?.classList.contains("math-source-open")).toBe(false);
      expect(source?.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(block?.classList.contains("math-source-open")).toBe(false);
      expect(source?.hidden).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("mousedown on rendered block math does not flash source state", () => {
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

      expect(source?.hidden).toBe(false);
      renderedChild?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );

      expect(block?.classList.contains("math-source-open")).toBe(false);
      expect(source?.hidden).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("clicking KaTeX output keeps the current editor selection stable", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "before\n\n$$\nE=mc^2\n$$\n\nafter",
    });

    try {
      const before = editor.view.state.selection.from;
      expect(editor.view.state.selection.$from.parent.type.name).toBe("paragraph");

      const block = host.querySelector<HTMLElement>("math-block");
      const source = host.querySelector<HTMLElement>("math-source");
      const preview = host.querySelector<HTMLElement>("math-preview");
      const renderedChild = preview?.querySelector<HTMLElement>(".katex *") ?? preview;

      expect(block).not.toBeNull();
      expect(source?.hidden).toBe(false);
      renderedChild?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      renderedChild?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(block?.classList.contains("math-source-open")).toBe(false);
      expect(source?.hidden).toBe(false);
      expect(editor.view.state.selection.from).toBe(before);
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
