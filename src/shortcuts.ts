import { setBlockType, wrapIn } from "prosemirror-commands";
import type { Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { wrapInList } from "prosemirror-schema-list";

import { convertCurrentBlockquoteCallout } from "./callouts.ts";
import { insertMathBlockCommand } from "./features/math.ts";

function insertHardBreak(schema: Schema): Command {
  return (state, dispatch) => {
    if (convertCurrentBlockquoteCallout(state, dispatch)) return true;
    if (dispatch) {
      const node = schema.nodes.hard_break.create();
      const tr = state.tr.replaceSelectionWith(node).scrollIntoView();
      dispatch(tr);
    }
    return true;
  };
}

function wrapSelection(open: string, close = open): Command {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection;
    if (dispatch) {
      const selected = empty ? "" : state.doc.textBetween(from, to, "\n", "\n");
      const tr = state.tr.insertText(`${open}${selected}${close}`, from, to);
      const cursor = empty ? from + open.length : from + open.length + selected.length + close.length;
      tr.setSelection(TextSelection.create(tr.doc, cursor));
      dispatch(tr);
    }
    return true;
  };
}

function insertEmptyLink(): Command {
  return (state, dispatch) => {
    const { from } = state.selection;
    if (dispatch) {
      const link = state.schema.marks.link.create({ href: "url", title: null });
      const tr = state.tr.insertText("[](url)", from, from);
      tr.addMark(from + 1, from + 1, link);
      tr.setSelection(TextSelection.create(tr.doc, from + 1));
      dispatch(tr);
    }
    return true;
  };
}

function setHeading(schema: Schema, level: number): Command {
  return setBlockType(schema.nodes.heading, { level, style: "atx" });
}

function insertCodeBlockCommand(schema: Schema): Command {
  return (state, dispatch) => {
    const node = schema.nodes.code_block.create({ lang: "" });
    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(node);
      tr.setSelection(TextSelection.create(tr.doc, tr.selection.from - 1));
      dispatch(tr);
    }
    return true;
  };
}

export function commonShortcutKeymap(schema: Schema): Record<string, Command> {
  return {
    "Mod-b": wrapSelection("**"),
    "Mod-i": wrapSelection("*"),
    "Mod-k": insertEmptyLink(),
    "Shift-Enter": insertHardBreak(schema),
    "Mod-0": setBlockType(schema.nodes.paragraph),
    "Mod-1": setHeading(schema, 1),
    "Mod-2": setHeading(schema, 2),
    "Mod-3": setHeading(schema, 3),
    "Mod-4": setHeading(schema, 4),
    "Mod-5": setHeading(schema, 5),
    "Mod-6": setHeading(schema, 6),
    "Mod-Shift-q": wrapIn(schema.nodes.blockquote),
    "Mod-Shift-8": wrapInList(schema.nodes.bullet_list),
    "Mod-Shift-7": wrapInList(schema.nodes.ordered_list),
    "Mod-Shift-k": insertCodeBlockCommand(schema),
    "Mod-Shift-m": insertMathBlockCommand(schema),
  };
}
