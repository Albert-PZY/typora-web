import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import type { EditorView as CodeMirrorView } from "@codemirror/view";

import { runFeatureCases } from "../utils.ts";
import { createEditor } from "../../src/lib.ts";
import { mermaidRenderer } from "../../src/renderers/mermaid.ts";
import { fencedCodeSpecs } from "../../specs/features/fenced-code.specs.ts";

runFeatureCases(fencedCodeSpecs);

type CodeMirrorElement = HTMLElement & {
  __typoraWebCodeMirrorView?: CodeMirrorView;
};

function createHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

function codeMirrorView(host: HTMLElement): CodeMirrorView {
  const cmElement = host.querySelector<CodeMirrorElement>(
    ".typora-web-code-editor .cm-editor",
  );
  const view = cmElement?.__typoraWebCodeMirrorView;
  if (!view) throw new Error("expected CodeMirror view");
  return view;
}

describe("fenced code node view", () => {
  test("CodeMirror edits update the ProseMirror document and markdown", () => {
    const host = createHost();
    const editor = createEditor(host, { initialContent: "```js\nold\n```" });

    try {
      const cm = codeMirrorView(host);
      cm.dispatch({ changes: { from: 0, to: cm.state.doc.length, insert: "next();" } });

      expect(editor.getMarkdown()).toBe("```js\nnext();\n```");
      expect(host.querySelector(".code-block-node")?.getAttribute("data-code"))
        .toBe("next();");
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".cb-lang-menu")?.remove();
    }
  });

  test("language menu selection updates the code block language and stays in lang focus", () => {
    const host = createHost();
    const editor = createEditor(host, { initialContent: "```\nplain\n```" });

    try {
      const input = host.querySelector<HTMLInputElement>(".cb-lang-input");
      expect(input).not.toBeNull();

      input!.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      const menu = document.body.querySelector<HTMLElement>(".cb-lang-menu");
      const python = menu?.querySelector<HTMLElement>("[data-lang-name='Python']");
      expect(menu?.hidden).toBe(false);
      expect(python).not.toBeNull();

      python!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );

      expect(input!.value).toBe("Python");
      expect(editor.getMarkdown()).toBe("```Python\nplain\n```");
      expect(host.querySelector(".code-block-node")?.hasAttribute("data-lang-focus"))
        .toBe(true);
      expect(menu?.hidden).toBe(true);
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".cb-lang-menu")?.remove();
    }
  });

  test("ArrowDown from the language input appends a paragraph at document end", () => {
    const host = createHost();
    const editor = createEditor(host, { initialContent: "```ts\nbody\n```" });

    try {
      const input = host.querySelector<HTMLInputElement>(".cb-lang-input");
      expect(input).not.toBeNull();

      input!.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      input!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
      );

      expect(editor.getMarkdown()).toBe("```ts\nbody\n```");
      expect(editor.view.state.doc.childCount).toBe(2);
      expect(editor.view.state.doc.child(1).type.name).toBe("paragraph");
      expect(editor.view.state.selection.$from.parent.type.name).toBe("paragraph");
    } finally {
      editor.destroy();
      host.remove();
      document.body.querySelector(".cb-lang-menu")?.remove();
    }
  });

  test("changing a Mermaid block to a normal language clears diagram state", async () => {
    const originalRender = mermaidRenderer.render;
    (mermaidRenderer as unknown as {
      render: typeof originalRender;
    }).render = async () => ({ state: "success", svg: "<svg><text>ok</text></svg>" });

    const host = createHost();
    const editor = createEditor(host, {
      initialContent: "```mermaid\ngraph TD\n  A --> B\n```",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 180));

      const wrapper = host.querySelector<HTMLElement>(".code-block-node");
      const panel = host.querySelector<HTMLElement>(".diagram-panel");
      expect(wrapper?.classList.contains("diagram-success")).toBe(true);
      expect(panel?.dataset.diagramState).toBe("success");

      const input = host.querySelector<HTMLInputElement>(".cb-lang-input");
      input!.value = "js";
      input!.dispatchEvent(new Event("input", { bubbles: true }));

      expect(wrapper?.classList.contains("has-diagram")).toBe(false);
      expect(wrapper?.classList.contains("diagram-success")).toBe(false);
      expect(panel?.dataset.diagramState).toBeUndefined();
      expect(panel?.textContent).toBe("");
      expect(editor.getMarkdown()).toBe("```js\ngraph TD\n  A --> B\n```");
    } finally {
      (mermaidRenderer as unknown as {
        render: typeof originalRender;
      }).render = originalRender;
      editor.destroy();
      host.remove();
      document.body.querySelector(".cb-lang-menu")?.remove();
    }
  });
});
