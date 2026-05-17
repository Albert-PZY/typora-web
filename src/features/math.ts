import type MarkdownIt from "markdown-it";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";
import type { Node as PMNode, Schema } from "prosemirror-model";
import { Plugin, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet, type EditorView, type NodeView } from "prosemirror-view";

import { markConsumed, type InlineSpan } from "../inline-parse.ts";
import { renderMathToHtml } from "../renderers/math.ts";
import type { FeatureSpec, InlineFeatureSpec } from "./_types.ts";

const MATH_DRAFT_RE = /^\$\$$/;

function escaped(text: string, pos: number): boolean {
  let count = 0;
  for (let i = pos - 1; i >= 0 && text[i] === "\\"; i--) count++;
  return count % 2 === 1;
}

const scanInlineMath: InlineFeatureSpec["scan"] = (text, consumed) => {
  const out: InlineSpan[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "$" || consumed[i] || escaped(text, i)) continue;
    if (text[i + 1] === "$" || text[i - 1] === "$") continue;
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] !== "$" || consumed[j] || escaped(text, j)) continue;
      if (text[j + 1] === "$" || text[j - 1] === "$") continue;
      const inner = text.slice(i + 1, j);
      if (!inner || /^\s|\s$/.test(inner)) break;
      let blocked = false;
      for (let k = i; k <= j; k++) {
        if (consumed[k]) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
      markConsumed(consumed, i, j + 1);
      out.push({
        type: "math_inline",
        from: i + 1,
        to: j,
        openFrom: i,
        openTo: i + 1,
        closeFrom: j,
        closeTo: j + 1,
        delimRanges: [
          { from: i, to: i + 1 },
          { from: i + 1, to: j, softInside: true },
          { from: j, to: j + 1 },
        ],
        widgetDecorations: [
          {
            pos: i + 1,
            when: "outside",
            kind: "math-inline",
            attrs: { tex: inner },
            side: -1,
          },
        ],
      });
      i = j;
      break;
    }
  }
  return out;
};

function mathBlockRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const start = state.bMarks[startLine]! + state.tShift[startLine]!;
  const max = state.eMarks[startLine]!;
  const line = state.src.slice(start, max).trim();
  if (line !== "$$") return false;
  if (silent) return true;

  let nextLine = startLine + 1;
  let content = "";
  let found = false;
  for (; nextLine < endLine; nextLine++) {
    const lineStart = state.bMarks[nextLine]! + state.tShift[nextLine]!;
    const lineMax = state.eMarks[nextLine]!;
    const raw = state.src.slice(lineStart, lineMax);
    if (raw.trim() === "$$") {
      found = true;
      break;
    }
    content += raw;
    if (nextLine < endLine - 1) content += "\n";
  }
  if (!found) return false;

  const token = state.push("math_block", "math-block", 0);
  token.block = true;
  token.content = content.replace(/\n$/, "");
  token.map = [startLine, nextLine + 1];
  state.line = nextLine + 1;
  return true;
}

function mathBlockPlugin(md: MarkdownIt): void {
  md.block.ruler.before("fence", "math_block", mathBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}

class MathBlockView implements NodeView {
  dom: HTMLElement;
  contentDOM: HTMLElement;
  private source: HTMLElement;
  private preview: HTMLElement;
  private view: EditorView;
  private getPos: () => number | undefined;
  private hasError = false;

  constructor(
    node: PMNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    const root = document.createElement("math-block");
    const source = document.createElement("math-source");
    const preview = document.createElement("math-preview");
    root.append(source, preview);
    this.dom = root;
    this.contentDOM = source;
    this.source = source;
    this.preview = preview;
    this.view = view;
    this.getPos = getPos;
    source.hidden = true;
    preview.setAttribute("contenteditable", "false");
    preview.addEventListener("mousedown", this.onPreviewMouseDown);
    preview.addEventListener("click", this.onPreviewClick);
    document.addEventListener("mousedown", this.onDocumentMouseDown);
    this.render(node);
  }

  private openSource(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dom.classList.add("math-source-open");
    this.source.hidden = false;
    this.moveSelectionIntoSource();
  }

  private onPreviewMouseDown = (event: MouseEvent): void => {
    this.openSource(event);
  };

  private onPreviewClick = (event: MouseEvent): void => {
    this.openSource(event);
  };

  private moveSelectionIntoSource(): void {
    const pos = this.getPos();
    if (pos == null) return;
    try {
      this.view.dispatch(
        this.view.state.tr.setSelection(TextSelection.create(this.view.state.doc, pos + 1)),
      );
      this.view.focus();
    } catch {}
  }

  private onDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target && this.dom.contains(target)) return;
    if (this.hasError) return;
    this.dom.classList.remove("math-source-open");
    this.source.hidden = true;
  };

  private render(node: PMNode): void {
    const result = renderMathToHtml(node.textContent, true);
    this.hasError = !result.ok;
    this.preview.dataset.mathState = result.ok ? "success" : "error";
    this.preview.innerHTML = result.html;
    if (!result.ok) {
      this.dom.classList.add("math-source-open");
      this.source.hidden = false;
    }
  }

  update(node: PMNode, _decorations: readonly Decoration[]): boolean {
    if (node.type.name !== "math_block") return false;
    this.render(node);
    return true;
  }

  destroy(): void {
    this.preview.removeEventListener("mousedown", this.onPreviewMouseDown);
    this.preview.removeEventListener("click", this.onPreviewClick);
    document.removeEventListener("mousedown", this.onDocumentMouseDown);
  }

  stopEvent(event: Event): boolean {
    const target = event.target as Node;
    return this.preview.contains(target);
  }
}

function mathBlockNodeViewPlugin(): Plugin {
  return new Plugin({
    props: {
      nodeViews: {
        math_block: (node, view, getPos) => new MathBlockView(node, view, getPos),
      },
    },
  });
}

function mathDraftPlugin(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const sel = state.selection;
        if (!sel.empty) return null;
        const $from = sel.$from;
        if ($from.parent.type.name !== "paragraph") return null;
        if (!MATH_DRAFT_RE.test($from.parent.textContent)) return null;
        const start = $from.start();
        return DecorationSet.create(state.doc, [
          Decoration.inline(start, start + 2, { class: "syntax-hint" }),
        ]);
      },
    },
  });
}

export function insertMathBlockCommand(schema: Schema) {
  return (
    state: import("prosemirror-state").EditorState,
    dispatch?: (tr: import("prosemirror-state").Transaction) => void,
  ): boolean => {
    const node = schema.nodes.math_block.create();
    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(node);
      tr.setSelection(TextSelection.create(tr.doc, tr.selection.from - 1));
      dispatch(tr);
    }
    return true;
  };
}

export const math: FeatureSpec = {
  name: "math",

  nodes: {
    math_block: {
      group: "block",
      content: "text*",
      marks: "",
      code: true,
      defining: true,
      parseDOM: [{ tag: "math-block", preserveWhitespace: "full" }],
      toDOM: () => ["math-block", ["math-source", 0]],
    },
  },

  mdItPlugins: [mathBlockPlugin],

  parserTokens: {
    math_block: (state, tok, schema) => {
      const textNodes = tok.content ? [schema.text(tok.content)] : [];
      state.push(schema.nodes.math_block.createChecked(null, textNodes));
    },
  },

  blockHandlers: {
    math_block: (state, node) => {
      state.write("$$\n");
      state.tick("inner");
      for (const ch of node.textContent) {
        state.tick("inner");
        if (ch === "\n") {
          state.out += "\n";
          if (state.delim) state.out += state.delim;
        } else {
          state.out += ch;
        }
        state.advance(1);
      }
      state.tick("inner");
      state.write("\n$$");
      state.closeBlock(node);
    },
  },

  keymap: (schema) => ({
    Enter: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      const para = $from.parent;
      if (para.type.name !== "paragraph") return false;
      if (!MATH_DRAFT_RE.test(para.textContent)) return false;
      if (dispatch) {
        const pos = $from.before();
        const block = schema.nodes.math_block.create();
        const tr = state.tr.replaceWith(pos, pos + para.nodeSize, block);
        tr.setSelection(TextSelection.create(tr.doc, pos + 1));
        dispatch(tr);
      }
      return true;
    },
    Backspace: (state, dispatch) => {
      const sel = state.selection;
      if (!sel.empty) return false;
      const $from = sel.$from;
      if ($from.parent.type.name !== "math_block") return false;
      if ($from.parent.content.size > 0) return false;
      if (dispatch) {
        const pos = $from.before();
        const tr = state.tr.delete(pos, pos + $from.parent.nodeSize);
        if (tr.doc.content.size === 0) {
          const p = schema.nodes.paragraph.createAndFill();
          if (p) tr.insert(0, p);
        }
        dispatch(tr);
      }
      return true;
    },
  }),

  plugins: () => [mathBlockNodeViewPlugin(), mathDraftPlugin()],

  inline: {
    priority: 0.8,
    scan: scanInlineMath,
    markNames: [],
    extRanges: () => [],
  },
};
