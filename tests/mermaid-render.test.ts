import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";
import {
  createMermaidRenderer,
  getMermaidRenderAppearance,
  mermaidRenderer,
  normalizeMermaidSourceForRender,
} from "../src/renderers/mermaid.ts";

describe("mermaid renderer", () => {
  test("adds render-only spaces only for split flowchart edge labels", () => {
    expect(normalizeMermaidSourceForRender("flowchart LR\nA-->\n|ok|B")).toBe(
      "flowchart LR\nA--> \n |ok|B",
    );
    expect(normalizeMermaidSourceForRender(
      "requirementDiagram\n  requirement stable {\n    id: R1\n  }",
    )).toBe(
      "requirementDiagram\n  requirement stable {\n    id: R1\n  }",
    );
  });

  test("initializes Mermaid lazily with strict security and light theme", async () => {
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
    expect(calls).toEqual([{
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: "default",
      themeVariables: {},
    }]);
  });

  test("uses a dark Mermaid theme when the document appearance is dark", async () => {
    const previousAppearance = document.documentElement.dataset.appearance;
    document.documentElement.dataset.appearance = "dark";
    const calls: unknown[] = [];
    const renderer = createMermaidRenderer(async () => ({
      initialize(config: unknown) {
        calls.push(config);
      },
      async render(id: string, code: string) {
        return { svg: `<svg data-id="${id}">${code}</svg>` };
      },
    }));

    try {
      expect(getMermaidRenderAppearance()).toBe("dark");
      const result = await renderer.render("graph TD\nA-->B");

      expect(result.state).toBe("success");
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatchObject({
        startOnLoad: false,
        securityLevel: "strict",
        suppressErrorRendering: true,
        theme: "base",
        themeVariables: {
          darkMode: true,
          primaryTextColor: "#ece7dd",
          actorTextColor: "#ece7dd",
          lineColor: "#aeb6c2",
          branchLabelColor: "#ece7dd",
          packet: {
            labelColor: "#ece7dd",
            blockFillColor: "#25272b",
          },
          wardley: {
            componentLabelColor: "#ece7dd",
          },
        },
      });
    } finally {
      if (previousAppearance === undefined) {
        delete document.documentElement.dataset.appearance;
      } else {
        document.documentElement.dataset.appearance = previousAppearance;
      }
    }
  });

  test("treats Mermaid-generated syntax error SVG as an error state", async () => {
    const renderer = createMermaidRenderer(async () => ({
      initialize() {},
      async render() {
        return {
          svg: '<svg><text>Syntax error in text</text><text>mermaid version 11.15.0</text></svg>',
        };
      },
    }));

    const result = await renderer.render("bad");

    expect(result.state).toBe("error");
    if (result.state !== "error") throw new Error("expected Mermaid syntax SVG to be rejected");
    expect(result.message).toContain("Mermaid syntax error");
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

      pre.classList.remove("diagram-success");
      pre.classList.add("diagram-error");
      expect(pre.classList.contains("diagram-error")).toBe(true);
      expect(pre.classList.contains("diagram-success")).toBe(false);
      expect(code.isConnected).toBe(true);
    } finally {
      editor.remove();
    }
  });

  test("clicking a Mermaid preview opens source above the diagram and outside click hides it", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "```mermaid\nflowchart LR\n  A --> B\n```",
    });

    try {
      const wrapper = host.querySelector<HTMLElement>(".code-block-node.has-diagram");
      const pre = host.querySelector("pre");
      const panel = host.querySelector<HTMLElement>(".diagram-panel");

      expect(wrapper).not.toBeNull();
      expect(pre).not.toBeNull();
      expect(panel).not.toBeNull();
      expect(pre?.contains(panel ?? null)).toBe(false);

      panel?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(wrapper?.classList.contains("diagram-source-open")).toBe(true);
      expect(host.querySelector(".typora-web-code-editor")).not.toBeNull();

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(wrapper?.classList.contains("diagram-source-open")).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("hides failed Mermaid diagram panels while keeping the source editor mounted", async () => {
    const originalRender = mermaidRenderer.render;
    (mermaidRenderer as unknown as {
      render: typeof originalRender;
    }).render = async () => ({ state: "error", message: "Mermaid syntax error" });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "```mermaid\nnot a graph\n```",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 180));

      const wrapper = host.querySelector<HTMLElement>(".code-block-node");
      const panel = host.querySelector<HTMLElement>(".diagram-panel");

      expect(wrapper?.classList.contains("diagram-error")).toBe(true);
      expect(panel?.hidden).toBe(true);
      expect(panel?.textContent).toBe("");
      expect(host.querySelector(".typora-web-code-editor")).not.toBeNull();
    } finally {
      (mermaidRenderer as unknown as {
        render: typeof originalRender;
      }).render = originalRender;
      editor.destroy();
      host.remove();
    }
  });

  test("rerenders visible Mermaid diagrams when the appearance changes", async () => {
    const previousAppearance = document.documentElement.dataset.appearance;
    document.documentElement.dataset.appearance = "light";
    const originalRender = mermaidRenderer.render;
    const renderedSources: string[] = [];
    (mermaidRenderer as unknown as {
      render: typeof originalRender;
    }).render = async (code: string) => {
      renderedSources.push(code);
      return {
        state: "success",
        svg: `<svg data-call="${renderedSources.length}"><text>${code}</text></svg>`,
      };
    };

    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: "```mermaid\nflowchart LR\n  A --> B\n```",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 180));

      const panel = host.querySelector<HTMLElement>(".diagram-panel");
      expect(renderedSources).toEqual(["flowchart LR\n  A --> B"]);
      expect(panel?.querySelector("svg")?.getAttribute("data-call")).toBe("1");

      document.documentElement.dataset.appearance = "dark";
      window.dispatchEvent(new CustomEvent("typora-web:appearancechange"));
      await new Promise((resolve) => setTimeout(resolve, 180));

      expect(renderedSources).toEqual([
        "flowchart LR\n  A --> B",
        "flowchart LR\n  A --> B",
      ]);
      expect(panel?.querySelector("svg")?.getAttribute("data-call")).toBe("2");
    } finally {
      (mermaidRenderer as unknown as {
        render: typeof originalRender;
      }).render = originalRender;
      if (previousAppearance === undefined) {
        delete document.documentElement.dataset.appearance;
      } else {
        document.documentElement.dataset.appearance = previousAppearance;
      }
      editor.destroy();
      host.remove();
    }
  });
});
