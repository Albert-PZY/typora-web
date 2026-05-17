import { describe, expect, test } from "@voidzero-dev/vite-plus-test";
import { TextSelection } from "prosemirror-state";

import { apply, setup } from "./utils.ts";
import { serialize } from "../src/serializer.ts";

function selectText(md: string, from: number, to: number) {
  const state = setup(md);
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
}

describe("common editing shortcuts", () => {
  test("Mod-b wraps the selection in strong delimiters", () => {
    const state = selectText("bold", 1, 5);
    const next = apply(state, ["<Mod-b>"]);
    expect(serialize(next.doc)).toBe("**bold**");
  });

  test("Mod-i wraps the selection in emphasis delimiters", () => {
    const state = selectText("em", 1, 3);
    const next = apply(state, ["<Mod-i>"]);
    expect(serialize(next.doc)).toBe("*em*");
  });

  test("Mod-k inserts an empty inline link shell at the cursor", () => {
    const next = apply(setup("go"), ["<Mod-k>", "x"]);
    expect(serialize(next.doc)).toBe("go[x](url)");
  });

  test("Mod-1 turns the current paragraph into an ATX heading", () => {
    const next = apply(setup("Title"), ["<Mod-1>"]);
    expect(serialize(next.doc)).toBe("# Title");
  });

  test("Mod-0 turns the current heading into a paragraph", () => {
    const next = apply(setup("# Title"), ["<Mod-0>"]);
    expect(serialize(next.doc)).toBe("Title");
  });

  test("Mod-Shift-M inserts a math block", () => {
    const next = apply(setup(""), ["<Mod-Shift-M>"]);
    expect(serialize(next.doc)).toBe("$$\n\n$$");
  });

  test("Shift-Enter inserts a Markdown hard break", () => {
    const next = apply(setup("line"), ["<Shift-Enter>", "next"]);
    expect(serialize(next.doc)).toBe("line  \nnext");
  });

  test("Mod-Shift-K inserts an empty fenced code block shell", () => {
    const next = apply(setup(""), ["<Mod-Shift-K>"]);
    expect(serialize(next.doc)).toBe("```\n\n```");
  });

  test("Mod-Shift-Q wraps the current paragraph in a blockquote", () => {
    const next = apply(setup("quote"), ["<Mod-Shift-Q>"]);
    expect(serialize(next.doc)).toBe("> quote");
  });

  test("Mod-Shift-8 wraps the current paragraph in a bullet list", () => {
    const next = apply(setup("item"), ["<Mod-Shift-8>"]);
    expect(serialize(next.doc)).toBe("- item");
  });

  test("undo and redo are wired through common shortcuts", () => {
    const next = apply(setup(""), ["a", "<Mod-z>", "<Mod-y>"]);
    expect(serialize(next.doc)).toBe("a");
  });
});
