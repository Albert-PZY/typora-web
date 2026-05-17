import { readFileSync } from "node:fs";

import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { EditorView } from "prosemirror-view";

import { createState } from "../src/editor.ts";
import { parse } from "../src/parser.ts";
import { sanitizeHtml } from "../src/sanitize.ts";
import { schema } from "../src/schema.ts";
import { serialize } from "../src/serializer.ts";

function mountHtmlBlock(markdown: string): {
  block: HTMLElement;
  view: EditorView;
  cleanup: () => void;
} {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const view = new EditorView(mount, { state: createState(parse(markdown)) });
  const block = view.dom.querySelector<HTMLElement>("html-block");
  if (!block) {
    view.destroy();
    mount.remove();
    throw new Error("expected html-block to render");
  }
  return {
    block,
    view,
    cleanup: () => {
      view.destroy();
      mount.remove();
    },
  };
}

describe("CommonMark HTML blocks", () => {
  test("source chrome uses paragraph-scale spacing", () => {
    const widgetsCss = readFileSync("src/styles/widgets.css", "utf8");

    expect(widgetsCss).toContain("margin: 0.25em 0 0;");
    expect(widgetsCss).toContain("padding: 0.45em 0.6em;");
    expect(widgetsCss).toMatch(
      /\.ProseMirror html-block \.html-block-preview \{\s+display: flow-root;\s+margin: 0;\s+padding: 0;\s+\}/,
    );
    expect(widgetsCss).not.toContain("margin: 8px 0 0;");
    expect(widgetsCss).not.toContain("padding: 10px 12px;");
  });

  test("parse as a dedicated block node and serialize the original source", () => {
    const doc = parse('<div class="note">hello</div>');
    expect(doc.child(0).type).toBe(schema.nodes.html_block);
    expect(doc.child(0).attrs.raw).toBe('<div class="note">hello</div>');
    expect(serialize(doc)).toBe('<div class="note">hello</div>');
  });

  test("render through DOMPurify instead of raw innerHTML", () => {
    const html = sanitizeHtml(
      '<div onclick="alert(1)"><strong>safe</strong><script>alert(1)</script><a href="javascript:alert(1)">bad</a></div>',
    );

    expect(html).toContain("<strong>safe</strong>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  test("editor view renders sanitized HTML preview and reveals source on click", () => {
    const { block, cleanup } = mountHtmlBlock(
      [
        "<details>",
        "<summary>More</summary>",
        '<section onclick="alert(1)"><strong>safe</strong></section>',
        "</details>",
      ].join("\n"),
    );

    try {
      expect(block.querySelector("details")).toBeNull();
      expect(block.querySelector("summary")).toBeNull();
      expect(block.querySelector(".html-block-preview")?.textContent).toContain("More");
      expect(block.querySelector(".html-block-preview strong")?.textContent).toBe("safe");
      expect(block.querySelector(".html-block-preview")?.innerHTML).not.toContain("onclick");
      expect(block.querySelector<HTMLElement>(".html-block-source")?.hidden).toBe(true);

      block.querySelector<HTMLElement>(".html-block-preview")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );

      expect(block.classList.contains("html-source-open")).toBe(true);
      expect(block.querySelector<HTMLElement>(".html-block-source")?.hidden).toBe(false);
      expect(block.querySelector<HTMLTextAreaElement>(".html-block-source")?.value).toContain("<details>");
    } finally {
      cleanup();
    }
  });

  test("revealed source is editable and updates the sanitized preview plus markdown", () => {
    const { block, view, cleanup } = mountHtmlBlock('<div class="note">hello</div>');

    try {
      block.querySelector<HTMLElement>(".html-block-preview")?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );

      const source = block.querySelector<HTMLTextAreaElement>("textarea.html-block-source");
      expect(source).not.toBeNull();
      expect(source?.hidden).toBe(false);

      source!.value = '<section onclick="alert(1)"><em>updated</em></section>';
      source!.dispatchEvent(new InputEvent("input", { bubbles: true }));

      expect(block.querySelector(".html-block-preview em")?.textContent).toBe("updated");
      expect(block.querySelector(".html-block-preview")?.innerHTML).not.toContain("onclick");
      expect(serialize(view.state.doc)).toBe('<section onclick="alert(1)"><em>updated</em></section>');
    } finally {
      cleanup();
    }
  });
});
