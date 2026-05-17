import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { EditorView } from "prosemirror-view";

import { createState } from "../src/editor.ts";
import { parse } from "../src/parser.ts";
import { sanitizeHtml } from "../src/sanitize.ts";
import { schema } from "../src/schema.ts";
import { serialize } from "../src/serializer.ts";

function renderHtmlBlock(markdown: string): HTMLElement {
  const mount = document.createElement("div");
  document.body.appendChild(mount);
  const view = new EditorView(mount, { state: createState(parse(markdown)) });
  const block = view.dom.querySelector<HTMLElement>("html-block");
  if (!block) {
    view.destroy();
    mount.remove();
    throw new Error("expected html-block to render");
  }
  const clone = block.cloneNode(true) as HTMLElement;
  view.destroy();
  mount.remove();
  return clone;
}

describe("CommonMark HTML blocks", () => {
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

  test("editor view renders sanitized HTML and strips executable attributes", () => {
    const block = renderHtmlBlock(
      '<section onclick="alert(1)"><strong>safe</strong><script>alert(1)</script></section>',
    );

    expect(block.innerHTML).toContain("<strong>safe</strong>");
    expect(block.innerHTML).not.toContain("onclick");
    expect(block.innerHTML).not.toContain("<script");
  });
});
