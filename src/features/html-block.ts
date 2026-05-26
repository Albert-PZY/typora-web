import type { Node as PMNode, Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import type { EditorView, NodeView } from "prosemirror-view";

import {
  createEmbeddedCodeMirrorEditor,
  type EmbeddedCodeMirrorEditor,
} from "../code-highlighter.ts";
import { sanitizeHtml } from "../sanitize.ts";
import type { FeatureSpec } from "./_types.ts";

const HTML_COMMENT_BLOCK_RE = /^\s*<!--[\s\S]*?-->\s*$/;

function rawHtml(node: PMNode): string {
  return String(node.attrs.raw ?? "");
}

function isCommentOnly(raw: string): boolean {
  return HTML_COMMENT_BLOCK_RE.test(raw);
}

class HtmlBlockView implements NodeView {
  dom: HTMLElement;
  private preview: HTMLElement;
  private source: HTMLElement;
  private sourceEditor: EmbeddedCodeMirrorEditor;
  private view: EditorView;
  private getPos: () => number | undefined;
  private syncingFromProseMirror = false;

  constructor(
    node: PMNode,
    view: EditorView,
    getPos: () => number | undefined,
  ) {
    this.dom = document.createElement("html-block");
    this.dom.setAttribute("contenteditable", "false");
    this.view = view;
    this.getPos = getPos;
    this.preview = document.createElement("div");
    this.preview.className = "html-block-preview";
    this.preview.setAttribute("contenteditable", "false");
    this.source = document.createElement("div");
    this.source.className = "html-block-source";
    this.source.spellcheck = false;
    this.source.setAttribute("aria-label", "HTML source");
    this.source.hidden = true;
    this.preview.addEventListener("mousedown", this.onPreviewMouseDown);
    this.preview.addEventListener("click", this.onPreviewClick);
    this.source.addEventListener("mousedown", this.onSourceMouseDown);
    document.addEventListener("mousedown", this.onDocumentMouseDown);
    this.dom.append(this.source, this.preview);
    this.sourceEditor = createEmbeddedCodeMirrorEditor({
      parent: this.source,
      doc: rawHtml(node),
      language: "html",
      className: "typora-web-html-source",
      onChange: this.onSourceChange,
    });
    this.render(node);
  }

  update(node: PMNode): boolean {
    if (node.type.name !== "html_block") return false;
    this.render(node);
    return true;
  }

  private render(node: PMNode): void {
    const raw = rawHtml(node);
    this.dom.dataset.raw = raw;

    const preview = document.createElement("div");
    preview.innerHTML = sanitizeHtml(raw);
    normalizeInteractiveHtml(preview);
    this.preview.replaceChildren(...Array.from(preview.childNodes));

    if (this.sourceEditor.view.state.doc.toString() !== raw) {
      this.syncingFromProseMirror = true;
      this.sourceEditor.setDoc(raw);
      this.syncingFromProseMirror = false;
    }

    if (isCommentOnly(raw)) {
      this.source.classList.add("html-comment-source");
    } else {
      this.source.classList.remove("html-comment-source");
    }
  }

  private openSource(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dom.classList.add("html-source-open");
    this.source.hidden = false;
    try { this.sourceEditor.view.focus(); } catch {}
  }

  private onPreviewMouseDown = (event: MouseEvent): void => {
    this.openSource(event);
  };

  private onPreviewClick = (event: MouseEvent): void => {
    this.openSource(event);
  };

  private onSourceMouseDown = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  private onSourceChange = (raw: string): void => {
    if (this.syncingFromProseMirror) return;
    const pos = this.getPos();
    if (pos == null) return;
    const node = this.view.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "html_block") return;
    if (raw === rawHtml(node)) return;
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        raw,
      }),
    );
  };

  private onDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target && this.dom.contains(target)) return;
    this.dom.classList.remove("html-source-open");
    this.source.hidden = true;
  };

  destroy(): void {
    this.preview.removeEventListener("mousedown", this.onPreviewMouseDown);
    this.preview.removeEventListener("click", this.onPreviewClick);
    this.source.removeEventListener("mousedown", this.onSourceMouseDown);
    document.removeEventListener("mousedown", this.onDocumentMouseDown);
    this.sourceEditor.destroy();
  }

  stopEvent(event: Event): boolean {
    const target = event.target as Node;
    return this.preview.contains(target) || this.source.contains(target);
  }

  ignoreMutation(): boolean {
    return true;
  }
}

function normalizeInteractiveHtml(root: HTMLElement): void {
  for (const summary of Array.from(root.querySelectorAll("summary"))) {
    const replacement = document.createElement("div");
    replacement.className = "html-summary";
    replacement.replaceChildren(...Array.from(summary.childNodes));
    summary.replaceWith(replacement);
  }
  for (const details of Array.from(root.querySelectorAll("details"))) {
    const replacement = document.createElement("div");
    replacement.className = "html-details";
    replacement.replaceChildren(...Array.from(details.childNodes));
    details.replaceWith(replacement);
  }
}

function htmlBlockPlugin(): Plugin {
  return new Plugin({
    props: {
      nodeViews: {
        html_block: (node, view, getPos) => new HtmlBlockView(node, view, getPos),
      },
    },
  });
}

function createCommentParagraph(raw: string, schema: Schema) {
  return schema.nodes.paragraph.createChecked(null, raw ? [schema.text(raw)] : []);
}

export const htmlBlock: FeatureSpec = {
  name: "html-block",

  nodes: {
    html_block: {
      group: "block",
      atom: true,
      selectable: true,
      attrs: { raw: { default: "" } },
      parseDOM: [
        {
          tag: "html-block",
          getAttrs: (el) => ({ raw: (el as HTMLElement).dataset.raw ?? "" }),
        },
      ],
      toDOM: (node) => [
        "html-block",
        { "data-raw": rawHtml(node), contenteditable: "false" },
        ["code", rawHtml(node)],
      ],
    },
  },

  parserTokens: {
    html_block: (state, token, schema) => {
      const raw = token.content.replace(/\n$/, "");
      if (isCommentOnly(raw)) {
        state.push(createCommentParagraph(raw, schema));
        return;
      }
      state.push(schema.nodes.html_block.createChecked({ raw }));
    },
    html_inline: (state, token) => {
      state.addText(token.content);
    },
  },

  blockHandlers: {
    html_block: (state, node) => {
      state.write(rawHtml(node));
      state.closeBlock(node);
    },
  },

  plugins: () => [htmlBlockPlugin()],
};
