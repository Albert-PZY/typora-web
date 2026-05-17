import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

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
});
