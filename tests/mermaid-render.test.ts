import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { readFileSync } from "node:fs";

import { createMermaidRenderer } from "../src/renderers/mermaid.ts";

const widgetsCss = readFileSync("src/styles/widgets.css", "utf8");

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

  test("returns an error state when Mermaid rendering hangs", async () => {
    const renderer = createMermaidRenderer(async () => ({
      initialize() {},
      async render() {
        return await new Promise<{ svg: string }>(() => {});
      },
    }), 1);

    const result = await renderer.render("graph TD\nA-->B");

    expect(result.state).toBe("error");
    if (result.state !== "error") throw new Error("expected Mermaid timeout error");
    expect(result.message).toContain("timed out");
  });
});

describe("mermaid source visibility policy", () => {
  test("hides code only when a Mermaid diagram rendered successfully", () => {
    const editor = document.createElement("div");
    editor.className = "ProseMirror";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    const diagram = document.createElement("div");
    diagram.className = "diagram-panel";
    pre.className = "has-diagram diagram-success";
    pre.append(code, diagram);
    editor.appendChild(pre);
    document.body.appendChild(editor);
    try {
      expect(pre.classList.contains("diagram-success")).toBe(true);
      expect(pre.classList.contains("diagram-error")).toBe(false);
      expect(widgetsCss).toContain(".ProseMirror pre.has-diagram.diagram-success > code");
      expect(widgetsCss).toContain("display: none");

      pre.classList.remove("diagram-success");
      pre.classList.add("diagram-error");
      expect(pre.classList.contains("diagram-error")).toBe(true);
      expect(pre.classList.contains("diagram-success")).toBe(false);
      expect(code.isConnected).toBe(true);
    } finally {
      editor.remove();
    }
  });
});
