import { InputRule, wrappingInputRule } from "prosemirror-inputrules";
import { TextSelection, type Command } from "prosemirror-state";

import {
  calloutAttrsFromSource,
  convertCurrentBlockquoteCallout,
} from "../callouts.ts";
import type { FeatureSpec } from "./_types.ts";

// Blockquote — no draft concept; input rule commits immediately.
//
// Trigger: at the start of a paragraph, typing `>` then ` ` (space)
// wraps the paragraph into a blockquote. The space is the trigger —
// `>` alone is still plain text, but `> ` IS the blockquote. pretty
// renders a blockquote as `<bq>content</bq>` (multi-block children
// joined by `\n`) — the tag form is what distinguishes a real
// blockquote from a paragraph whose text happens to start with `> `.
//
// Enter behaviour inside a blockquote is fully handled by
// prosemirror-commands' baseKeymap (chainCommands of newlineInCode,
// createParagraphNear, liftEmptyBlock, splitBlock):
//   - non-empty line → splitBlock, new paragraph stays inside blockquote
//   - empty line     → liftEmptyBlock lifts the empty paragraph out of
//                      the blockquote, landing the cursor after it
// So this feature does not contribute a keymap.

const calloutInputRule = new InputRule(
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|DANGER)\]$/i,
  (state, match, start, end) => {
    const attrs = calloutAttrsFromSource(match[1]);
    if (!attrs) return null;

    const $start = state.doc.resolve(start);
    if ($start.parent.type.name !== "paragraph") return null;
    const blockquoteDepth = $start.depth - 1;
    if (blockquoteDepth < 1) return null;
    const blockquote = $start.node(blockquoteDepth);
    if (blockquote.type.name !== "blockquote") return null;
    if ($start.index(blockquoteDepth) !== 0) return null;

    const tr = state.tr.setNodeMarkup($start.before(blockquoteDepth), undefined, {
      ...blockquote.attrs,
      ...attrs,
    });
    const nextChar = $start.parent.textBetween(
      $start.parentOffset + match[0].length - 1,
      $start.parentOffset + match[0].length,
    );
    tr.delete(start, nextChar === "]" ? end + 1 : end);
    return tr.setSelection(TextSelection.create(tr.doc, start));
  },
);

const calloutEnter: Command = (state, dispatch) => {
  if (convertCurrentBlockquoteCallout(state, dispatch)) return true;

  const sel = state.selection;
  if (!sel.empty) return false;
  const $from = sel.$from;
  if ($from.parent.type.name !== "paragraph") return false;
  if ($from.parent.content.size !== 0) return false;

  const blockquoteDepth = $from.depth - 1;
  if (blockquoteDepth < 1) return false;
  const blockquote = $from.node(blockquoteDepth);
  if (blockquote.type.name !== "blockquote" || !blockquote.attrs.alert) return false;
  if ($from.index(blockquoteDepth) !== 0) return false;

  if (dispatch) {
    const insertPos = $from.after();
    const tr = state.tr.insert(insertPos, state.schema.nodes.paragraph.create());
    tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
    dispatch(tr);
  }
  return true;
};

export const blockquote: FeatureSpec = {
  name: "blockquote",

  inputRules: (schema) => [
    // `wrappingInputRule(/^> $/, type)` fires the moment the paragraph
    // text becomes exactly "> " — i.e. when the user types the space.
    // PM's wrapping helper strips the matched `> ` text and wraps the
    // paragraph in a blockquote, landing the cursor at the start of the
    // now-empty inner paragraph.
    wrappingInputRule(/^> $/, schema.nodes.blockquote),
    calloutInputRule,
  ],

  keymap: () => ({ Enter: calloutEnter }),

};
