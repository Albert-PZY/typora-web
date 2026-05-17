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

  test("clicking block math preview opens the source editor above the preview", () => {
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
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
