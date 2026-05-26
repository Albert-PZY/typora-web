import type { Node as PMNode } from "prosemirror-model";
import { TextSelection, type Command } from "prosemirror-state";

export type CalloutKind =
  | "note"
  | "tip"
  | "important"
  | "warning"
  | "caution"
  | "danger";

export type CalloutAttrs = {
  alert: CalloutKind;
  alertSource: string;
};

const CALLOUT_MARKER_RE =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DANGER)\][ \t]*(?:\n|$)/i;
const CALLOUT_MARKER_LINE_RE =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DANGER)\][ \t]*$/i;

export function normalizeCalloutKind(value: string | null | undefined): CalloutKind | null {
  switch ((value ?? "").toLowerCase()) {
    case "note":
      return "note";
    case "tip":
      return "tip";
    case "important":
      return "important";
    case "warning":
      return "warning";
    case "caution":
      return "caution";
    case "danger":
      return "danger";
    default:
      return null;
  }
}

export function calloutAttrsFromSource(
  value: string | null | undefined,
): CalloutAttrs | null {
  const source = (value ?? "").trim();
  const kind = normalizeCalloutKind(source);
  if (!kind) return null;
  return { alert: kind, alertSource: source.toUpperCase() };
}

export function getCalloutAttrsFromElement(el: HTMLElement): CalloutAttrs | null {
  const dataSource = el.getAttribute("data-alert-source");
  const dataKind = el.getAttribute("data-alert");
  const fromData = calloutAttrsFromSource(dataSource ?? dataKind);
  if (fromData) return fromData;

  for (const cls of Array.from(el.classList)) {
    const match = /^(?:md-alert|md-alert-text|markdown-alert)-(note|tip|important|warning|caution|danger)$/i.exec(
      cls,
    );
    if (!match) continue;
    return calloutAttrsFromSource(match[1]);
  }

  return null;
}

function stripCalloutMarker(paragraph: PMNode): {
  attrs: CalloutAttrs;
  paragraph: PMNode | null;
} | null {
  const first = paragraph.firstChild;
  if (!first?.isText) return null;

  const text = first.text ?? "";
  const match = CALLOUT_MARKER_RE.exec(text);
  if (!match) return null;

  const attrs = calloutAttrsFromSource(match[1]);
  if (!attrs) return null;

  const inline: PMNode[] = [];
  const remaining = text.slice(match[0].length);
  if (remaining) inline.push(paragraph.type.schema.text(remaining, first.marks));

  let dropLeadingBreak = remaining.length === 0;
  paragraph.forEach((child, _offset, index) => {
    if (index === 0) return;
    if (dropLeadingBreak) {
      dropLeadingBreak = false;
      if (child.type.name === "hard_break") return;
      if (child.isText && child.text?.startsWith("\n")) {
        const rest = child.text.slice(1);
        if (rest) inline.push(paragraph.type.schema.text(rest, child.marks));
        return;
      }
    }
    inline.push(child);
  });

  return {
    attrs,
    paragraph:
      inline.length > 0
        ? paragraph.type.createAndFill(paragraph.attrs, inline)
        : null,
  };
}

function foldBlockquote(node: PMNode): PMNode {
  if (node.attrs.alert) return node;
  const first = node.firstChild;
  if (!first || first.type.name !== "paragraph") return node;

  const stripped = stripCalloutMarker(first);
  if (!stripped) return node;

  const children: PMNode[] = [];
  if (stripped.paragraph) children.push(stripped.paragraph);
  node.forEach((child, _offset, index) => {
    if (index > 0) children.push(child);
  });
  if (children.length === 0) {
    children.push(node.type.schema.nodes.paragraph.create());
  }

  return node.type.createAndFill(
    { ...node.attrs, ...stripped.attrs },
    children,
  )!;
}

function transformBlock(node: PMNode): PMNode {
  if (node.isInline || node.childCount === 0) return node;

  const children: PMNode[] = [];
  let changed = false;
  node.forEach((child) => {
    const next = transformBlock(child);
    if (next !== child) changed = true;
    children.push(next);
  });

  let current = node;
  if (changed) current = node.type.createAndFill(node.attrs, children, node.marks)!;
  return current.type.name === "blockquote" ? foldBlockquote(current) : current;
}

export function foldMarkdownCallouts(doc: PMNode): PMNode {
  return transformBlock(doc);
}

export const convertCurrentBlockquoteCallout: Command = (state, dispatch) => {
  const sel = state.selection;
  if (!sel.empty) return false;
  const $from = sel.$from;
  if ($from.parent.type.name !== "paragraph") return false;

  const blockquoteDepth = $from.depth - 1;
  if (blockquoteDepth < 1) return false;
  const blockquote = $from.node(blockquoteDepth);
  if (blockquote.type.name !== "blockquote" || blockquote.attrs.alert) return false;
  if ($from.index(blockquoteDepth) !== 0) return false;

  const text = $from.parent.textContent;
  const match = CALLOUT_MARKER_LINE_RE.exec(text);
  if (!match) return false;
  const attrs = calloutAttrsFromSource(match[1]);
  if (!attrs) return false;

  if (dispatch) {
    const paragraphStart = $from.start();
    const paragraphEnd = $from.end();
    const blockquotePos = $from.before(blockquoteDepth);
    const tr = state.tr.setNodeMarkup(blockquotePos, undefined, {
      ...blockquote.attrs,
      ...attrs,
    });
    tr.delete(paragraphStart, paragraphEnd);
    tr.setSelection(TextSelection.create(tr.doc, paragraphStart));
    dispatch(tr);
  }
  return true;
};
