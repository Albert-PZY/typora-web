import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";

/**
 * Source ⇄ preview pollution harness.
 *
 * Switching modes does:
 *   preview → serialize(doc) → source editor
 *   source  → parse(md) → rebuild preview
 *
 * A single cycle may normalize intentionally (e.g. indented code → fenced).
 * Further cycles must not keep rewriting the Markdown string — that is
 * "pollution" (extra escapes, doubled markers, drifting syntax).
 */

function withEditor(initialContent: string, run: (editor: ReturnType<typeof createEditor>) => void): void {
  const host = document.createElement("div");
  document.body.append(host);
  const editor = createEditor(host, { initialContent });
  try {
    run(editor);
  } finally {
    editor.destroy();
    host.remove();
  }
}

/** Toggle to source and back once; return the preview-mode markdown after. */
function cycleOnce(editor: ReturnType<typeof createEditor>): string {
  expect(editor.isSourceMode()).toBe(false);
  editor.toggleSource();
  expect(editor.isSourceMode()).toBe(true);
  const inSource = editor.getMarkdown();
  editor.toggleSource();
  expect(editor.isSourceMode()).toBe(false);
  const after = editor.getMarkdown();
  // Source buffer and post-exit preview must agree for a no-edit cycle.
  expect(after).toBe(inSource);
  return after;
}

/** After one full cycle, further cycles must be string-stable. */
function expectStableAfterFirstCycle(md: string, cycles = 4): void {
  withEditor(md, (editor) => {
    const first = cycleOnce(editor);
    for (let i = 0; i < cycles; i++) {
      const next = cycleOnce(editor);
      expect(next, `cycle ${i + 2} drifted from first cycle result`).toBe(first);
    }
  });
}

const SAMPLES: Array<{ name: string; md: string }> = [
  {
    name: "paragraphs and soft/hard breaks",
    md: "line a\nline b\n\nline c  \nline d",
  },
  {
    name: "headings atx and setext",
    md: "# H1\n\n## H2\n\n### H3\n\nSetext One\n===\n\nSetext Two\n---\n\nbody",
  },
  {
    name: "inline marks method-B",
    md: [
      "plain **bold** *italic* ***both*** ~~strike~~ ==highlight==",
      "H~2~O and x^2^ and <u>underline</u>",
      "code `npm test` and math $e^{i\\pi}+1=0$",
      "escapes \\*not\\* and \\# not heading and \\- not list",
    ].join("\n\n"),
  },
  {
    name: "links images autolinks",
    md: [
      "see [site](https://example.com) and [titled](https://example.com \"home\")",
      "autolink <https://example.com> and <hello@example.com>",
      "![alt](favicon.svg) and ![](https://example.com/x.png \"cap\")",
      "ref [label][1] and bare https://spec.commonmark.org/0.31.2/",
      "",
      "[1]: https://example.com \"ref title\"",
    ].join("\n"),
  },
  {
    name: "lists ordered bullet task nested",
    md: [
      "- a",
      "- b **bold**",
      "  - nested",
      "- [ ] todo",
      "- [x] done",
      "",
      "1. one",
      "2. two",
      "",
      // Same-type adjacent lists (e.g. after marker normalization) must not
      // gain a blank line between them across source ⇄ preview cycles.
      "- plus",
      "- star",
    ].join("\n"),
  },
  {
    name: "adjacent bullet then ordered lists stay stable",
    md: "- a\n- b\n\n1. one\n2. two\n\n- c\n- d",
  },
  {
    name: "blockquote and callouts",
    md: [
      "> quoted **text**",
      ">",
      "> second para",
      "",
      "> [!NOTE]",
      "> note body",
      "",
      "> [!TIP]",
      "> tip body",
      "",
      "> [!IMPORTANT]",
      "> important",
      "",
      "> [!WARNING]",
      "> warn",
      "",
      "> [!DANGER]",
      "> danger",
    ].join("\n"),
  },
  {
    name: "table with alignment and marks",
    md: [
      "| Left | Center | Right |",
      "| :--- | :---: | ---: |",
      "| a | **b** | `c` |",
      "| ==hi== | x | y |",
    ].join("\n"),
  },
  {
    name: "fenced code math mermaid html",
    md: [
      "```ts",
      "const x: number = 1;",
      "console.log(`hi`);",
      "```",
      "",
      "```",
      "plain fence",
      "```",
      "",
      "$$",
      "a^2 + b^2 = c^2",
      "$$",
      "",
      "```mermaid",
      "flowchart LR",
      "  A[Markdown] --> B[Preview]",
      "```",
      "",
      "<details>",
      "<summary>More</summary>",
      "<p>Hidden</p>",
      "</details>",
    ].join("\n"),
  },
  {
    name: "front matter hr toc comment emoji",
    md: [
      "---",
      "title: Demo",
      "status: beta",
      "---",
      "",
      "# Title",
      "",
      "[toc]",
      "",
      "before <!-- note --> after",
      "",
      "ship it :rocket: now",
      "",
      "---",
      "",
      "end",
    ].join("\n"),
  },
  {
    name: "composite document",
    md: [
      "# Title",
      "",
      "Intro with **bold**, *italic*, `code`, and a [link](https://example.com).",
      "",
      "> A quote with ==highlight==.",
      "",
      "- first",
      "- second",
      "  1. nested ordered",
      "  2. more",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "```js",
      "export const n = 1;",
      "```",
      "",
      "Math $x_1$ and block:",
      "",
      "$$",
      "\\int_0^1 x\\,dx",
      "$$",
    ].join("\n"),
  },
];

describe("source ⇄ preview mode pollution", () => {
  for (const sample of SAMPLES) {
    test(`stable multi-cycle: ${sample.name}`, () => {
      expectStableAfterFirstCycle(sample.md);
    });
  }

  test("source buffer matches serialize(doc) on enter without rewriting on re-enter", () => {
    withEditor("**hello** and *world*", (editor) => {
      const preview0 = editor.getMarkdown();
      editor.toggleSource();
      const source1 = editor.getMarkdown();
      // Entering source serializes the live doc; should equal prior getMarkdown.
      expect(source1).toBe(preview0);
      editor.toggleSource();
      const preview1 = editor.getMarkdown();
      expect(preview1).toBe(source1);
      editor.toggleSource();
      const source2 = editor.getMarkdown();
      expect(source2).toBe(source1);
      editor.toggleSource();
    });
  });

  test("editing only in source then exiting does not double-escape on next enter", () => {
    withEditor("plain", (editor) => {
      editor.toggleSource();
      editor.setMarkdown("literal *star* and # hash and - dash");
      editor.toggleSource();
      const afterEdit = editor.getMarkdown();
      const again = cycleOnce(editor);
      expect(again).toBe(afterEdit);
      // Must not accumulate backslashes across cycles.
      expect(again).not.toMatch(/\\\\/);
    });
  });

  test("repeated toggles on empty document stay empty", () => {
    withEditor("", (editor) => {
      for (let i = 0; i < 6; i++) editor.toggleSource();
      expect(editor.isSourceMode()).toBe(false);
      expect(editor.getMarkdown().trim()).toBe("");
    });
  });

  test("demo-like callout markers are not duplicated across toggles", () => {
    const md = "> [!NOTE]\n> body with **bold**";
    withEditor(md, (editor) => {
      const first = cycleOnce(editor);
      const noteCount = (first.match(/\[!NOTE\]/g) ?? []).length;
      expect(noteCount).toBe(1);
      for (let i = 0; i < 3; i++) {
        const next = cycleOnce(editor);
        expect((next.match(/\[!NOTE\]/g) ?? []).length).toBe(1);
        expect(next).toBe(first);
      }
    });
  });

  test("emphasis delimiters are not doubled across toggles", () => {
    withEditor("**bold** *em* ~~del~~ ==mark==", (editor) => {
      const first = cycleOnce(editor);
      expect(first).not.toMatch(/\*{4,}/);
      expect(first).not.toMatch(/~{3,}/);
      expect(first).not.toMatch(/={3,}/);
      expect(cycleOnce(editor)).toBe(first);
    });
  });
});
