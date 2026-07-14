import { undo, redo } from "prosemirror-history";
import { AllSelection, type Command } from "prosemirror-state";

import type { Editor } from "../src/lib.ts";
import { schema } from "../src/schema.ts";
import { serialize } from "../src/serializer.ts";
import { commonShortcutKeymap, wrapSelection } from "../src/shortcuts.ts";

const shortcutCommands = commonShortcutKeymap(schema);

const actionCommands: Record<string, Command | undefined> = {
  undo,
  redo,
  paragraph: shortcutCommands["Mod-0"],
  "heading-1": shortcutCommands["Mod-1"],
  "heading-2": shortcutCommands["Mod-2"],
  "heading-3": shortcutCommands["Mod-3"],
  "math-block": shortcutCommands["Mod-Shift-m"],
  "code-block": shortcutCommands["Mod-Shift-k"],
  quote: shortcutCommands["Mod-Shift-q"],
  "ordered-list": shortcutCommands["Mod-Shift-7"],
  "bullet-list": shortcutCommands["Mod-Shift-8"],
  "task-list": shortcutCommands["Mod-Shift-x"],
  bold: shortcutCommands["Mod-b"],
  italic: shortcutCommands["Mod-i"],
  underline: shortcutCommands["Mod-u"],
  "inline-code": shortcutCommands["Mod-Shift-`"],
  "inline-math": wrapSelection("$"),
  strike: shortcutCommands["Alt-Shift-5"],
  highlight: wrapSelection("=="),
  link: shortcutCommands["Mod-k"],
  image: wrapSelection("![", "](url)"),
};

function applyCommand(editor: Editor, command: Command | undefined): boolean {
  if (!command || editor.isSourceMode()) return false;
  const handled = command(
    editor.view.state,
    (transaction) => editor.view.dispatch(transaction),
    editor.view,
  );
  if (handled) editor.focus();
  return handled;
}

function stripInlineFormatting(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\((?:\\.|[^)])*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:\\.|[^)])*\)/g, "$1")
    .replace(/<\/?u>/gi, "")
    .replace(/\*\*|__|~~|==|`+|\$|\*|_|\^|~/g, "");
}

const clearInlineFormatting: Command = (state, dispatch) => {
  const { from, to, empty } = state.selection;
  if (empty) return false;
  const source = state.doc.textBetween(from, to, "\n", "\n");
  const plain = stripInlineFormatting(source);
  if (dispatch) dispatch(state.tr.insertText(plain, from, to).scrollIntoView());
  return true;
};

export function runEditorCommand(editor: Editor, action: string): boolean {
  if (action === "clear-style") return applyCommand(editor, clearInlineFormatting);
  return applyCommand(editor, actionCommands[action]);
}

export function getSelectedEditorText(editor: Editor): string | null {
  if (editor.isSourceMode()) return null;
  const { from, to, empty } = editor.view.state.selection;
  if (empty) return null;
  return editor.view.state.doc.textBetween(from, to, "\n", "\n");
}

export function getSelectedEditorMarkdown(editor: Editor): string | null {
  if (editor.isSourceMode() || editor.view.state.selection.empty) return null;
  const slice = editor.view.state.selection.content();
  try {
    return serialize(schema.nodes.doc.create(null, slice.content));
  } catch {
    return getSelectedEditorText(editor);
  }
}

export function replaceEditorSelection(editor: Editor, text: string): boolean {
  if (editor.isSourceMode()) return false;
  editor.view.dispatch(editor.view.state.tr.insertText(text).scrollIntoView());
  editor.focus();
  return true;
}

export function deleteEditorSelection(editor: Editor): boolean {
  if (editor.isSourceMode() || editor.view.state.selection.empty) return false;
  editor.view.dispatch(editor.view.state.tr.deleteSelection().scrollIntoView());
  editor.focus();
  return true;
}

export function selectEditorDocument(editor: Editor): boolean {
  if (editor.isSourceMode()) return false;
  editor.view.dispatch(editor.view.state.tr.setSelection(new AllSelection(editor.view.state.doc)));
  editor.focus();
  return true;
}
