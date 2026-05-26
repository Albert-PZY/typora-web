import { readFileSync } from "node:fs";

import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import type { EditorView as CodeMirrorView } from "@codemirror/view";
import { DOMParser as PMDOMParser } from "prosemirror-model";
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

function htmlSourceEditor(block: HTMLElement): CodeMirrorView {
  const source = block.querySelector<HTMLElement>("div.html-block-source");
  const cmElement = source?.querySelector<HTMLElement>(".cm-editor") as
    | (HTMLElement & { __typoraWebCodeMirrorView?: CodeMirrorView })
    | null;
  const editorView = cmElement?.__typoraWebCodeMirrorView;
  if (!editorView) throw new Error("expected CodeMirror view");
  return editorView;
}

describe("CommonMark HTML blocks", () => {
  test("source reveal uses inline text styling instead of an input frame", () => {
    const widgetsCss = readFileSync("src/styles/widgets.css", "utf8");

    expect(widgetsCss).toMatch(
      /\.ProseMirror html-block \.html-block-source \{\s+display: block;\s+margin: 0;\s+padding: 0;/,
    );
    expect(widgetsCss).toContain("background: transparent;");
    expect(widgetsCss).toContain("font: inherit;");
    expect(widgetsCss).toMatch(
      /\.ProseMirror html-block \.html-block-preview \{\s+display: flow-root;\s+margin: 0;\s+padding: 0;\s+\}/,
    );
    expect(widgetsCss).toContain(
      ".ProseMirror html-block.html-source-open .html-block-source { margin-bottom: 10px; }",
    );
    expect(widgetsCss).not.toContain(
      ".ProseMirror html-block.html-source-open .html-block-preview { display: none; }",
    );
    expect(widgetsCss).not.toContain("min-height: 4.5em;");
    expect(widgetsCss).not.toContain("margin: 8px 0 0;");
    expect(widgetsCss).not.toContain("padding: 10px 12px;");
  });

  test("parse as a dedicated block node and serialize the original source", () => {
    const doc = parse('<div class="note">hello</div>');
    expect(doc.child(0).type).toBe(schema.nodes.html_block);
    expect(doc.child(0).attrs.raw).toBe('<div class="note">hello</div>');
    expect(serialize(doc)).toBe('<div class="note">hello</div>');
  });

  test("ProseMirror DOM parse and serialize preserve raw HTML block attrs", () => {
    const host = document.createElement("div");
    const htmlBlock = document.createElement("html-block");
    htmlBlock.dataset.raw = '<aside data-x="1">saved</aside>';
    host.appendChild(htmlBlock);

    const doc = PMDOMParser.fromSchema(schema).parse(host);

    expect(doc.child(0).type).toBe(schema.nodes.html_block);
    expect(doc.child(0).attrs.raw).toBe('<aside data-x="1">saved</aside>');
    expect(schema.nodes.html_block.spec.toDOM?.(doc.child(0))).toEqual([
      "html-block",
      { "data-raw": '<aside data-x="1">saved</aside>', contenteditable: "false" },
      ["code", '<aside data-x="1">saved</aside>'],
    ]);
  });

  test("comment-only HTML blocks remain editable source text instead of preview atoms", () => {
    const doc = parse("<!-- hidden note -->");
    expect(doc.child(0).type.name).toBe("paragraph");
    expect(doc.child(0).textContent).toBe("<!-- hidden note -->");
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

  test("filters dangerous URL protocols beyond javascript", () => {
    const html = sanitizeHtml(
      [
        '<a href="vbscript:msgbox(1)">bad</a>',
        '<img src="data:text/html,<script>alert(1)</script>">',
        '<a href="https://example.com">safe</a>',
      ].join(""),
    );

    expect(html).not.toContain("vbscript:");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain('href="https://example.com"');
  });

  test("editor view renders sanitized HTML preview and reveals highlighted source on click", async () => {
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
      const source = block.querySelector<HTMLElement>(".html-block-source");
      expect(source?.tagName).toBe("DIV");
      expect(source?.hidden).toBe(true);

      block.querySelector<HTMLElement>(".html-block-preview")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      await Promise.resolve();

      expect(block.classList.contains("html-source-open")).toBe(true);
      expect(source?.hidden).toBe(false);
      expect(source?.nextElementSibling).toBe(block.querySelector(".html-block-preview"));
      expect(source?.querySelector(".cm-editor.typora-web-html-source")).not.toBeNull();
      expect(source?.textContent).toContain("<details>");
      expect(source?.querySelector("details")).toBeNull();
      expect(block.querySelector(".html-block-preview strong")?.textContent).toBe("safe");
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

      const source = block.querySelector<HTMLElement>("div.html-block-source");
      expect(source).not.toBeNull();
      expect(source?.hidden).toBe(false);

      const editorView = htmlSourceEditor(block);
      const current = editorView.state.doc.toString();
      editorView.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: '<section onclick="alert(1)"><em>updated</em></section>',
        },
      });

      expect(block.querySelector(".html-block-preview em")?.textContent).toBe("updated");
      expect(block.querySelector(".html-block-preview")?.innerHTML).not.toContain("onclick");
      expect(serialize(view.state.doc)).toBe('<section onclick="alert(1)"><em>updated</em></section>');
    } finally {
      cleanup();
    }
  });

  test("external document click closes the source view while source mousedown stays local", () => {
    const { block, cleanup } = mountHtmlBlock('<div class="note">hello</div>');

    try {
      block.querySelector<HTMLElement>(".html-block-preview")?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
      );
      const source = block.querySelector<HTMLElement>("div.html-block-source");
      expect(source?.hidden).toBe(false);

      source?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      expect(source?.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      expect(block.classList.contains("html-source-open")).toBe(false);
      expect(source?.hidden).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("node view update syncs source editor text from ProseMirror changes", () => {
    const { block, view, cleanup } = mountHtmlBlock('<div class="note">hello</div>');

    try {
      const pos = 0;
      view.dispatch(
        view.state.tr.setNodeMarkup(pos, undefined, {
          raw: '<section><strong>fresh</strong></section>',
        }),
      );

      expect(block.dataset.raw).toBe('<section><strong>fresh</strong></section>');
      expect(block.querySelector(".html-block-preview strong")?.textContent).toBe("fresh");
      expect(htmlSourceEditor(block).state.doc.toString()).toBe(
        '<section><strong>fresh</strong></section>',
      );
    } finally {
      cleanup();
    }
  });

  test("HTML image source edits keep a live preview with updated dimensions", () => {
    const { block, view, cleanup } = mountHtmlBlock(
      '<img src="favicon.svg" alt="Typora-Web logo" width="180" />',
    );

    try {
      const preview = block.querySelector<HTMLElement>(".html-block-preview");
      preview?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

      const source = block.querySelector<HTMLElement>("div.html-block-source");
      expect(source?.hidden).toBe(false);
      expect(source?.nextElementSibling).toBe(preview);
      expect(preview?.querySelector("img")?.getAttribute("width")).toBe("180");

      const editorView = htmlSourceEditor(block);
      const current = editorView.state.doc.toString();
      editorView.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: '<img src="favicon.svg" alt="Typora-Web logo" width="96" />',
        },
      });

      const image = preview?.querySelector("img");
      expect(image?.getAttribute("src")).toBe("favicon.svg");
      expect(image?.getAttribute("alt")).toBe("Typora-Web logo");
      expect(image?.getAttribute("width")).toBe("96");
      expect(block.dataset.raw).toBe(
        '<img src="favicon.svg" alt="Typora-Web logo" width="96" />',
      );
      expect(serialize(view.state.doc)).toBe(
        '<img src="favicon.svg" alt="Typora-Web logo" width="96" />',
      );
    } finally {
      cleanup();
    }
  });
});
