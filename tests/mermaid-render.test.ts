import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createMermaidRenderer } from "../src/renderers/mermaid.ts";

describe("mermaid renderer", () => {
  test("initializes Mermaid lazily with strict security", async () => {
    const calls: unknown[] = [];
    const renderer = createMermaidRenderer(async () => ({
      initialize(config: unknown) {
        calls.push(config);
      },
      async render(id: string, code: string) {
        return { svg: `<svg data-id="${id}">${code}</svg>` };
      },
    }));

    const result = await renderer.render("graph TD\nA-->B");

    expect(result.state).toBe("success");
    if (result.state !== "success") throw new Error("expected Mermaid render success");
    expect(result.svg).toContain("<svg");
    expect(calls).toEqual([{ startOnLoad: false, securityLevel: "strict" }]);
  });

  test("returns an error state when Mermaid rendering rejects", async () => {
    const renderer = createMermaidRenderer(async () => ({
      initialize() {},
      async render() {
        throw new Error("bad graph");
      },
    }));

    const result = await renderer.render("bad");

    expect(result.state).toBe("error");
    if (result.state !== "error") throw new Error("expected Mermaid render error");
    expect(result.message).toContain("bad graph");
  });
});
