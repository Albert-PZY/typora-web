import type { Node as PMNode, Schema } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import type { NodeView } from "prosemirror-view";

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

  constructor(node: PMNode) {
    this.dom = document.createElement("html-block");
    this.dom.setAttribute("contenteditable", "false");
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
    preview.className = "html-block-render";

    if (isCommentOnly(raw)) {
      const comment = document.createElement("mark-comment");
      comment.textContent = raw;
      preview.append(comment);
    } else {
      preview.innerHTML = sanitizeHtml(raw);
    }

    this.dom.replaceChildren(preview);
  }

  ignoreMutation(): boolean {
    return true;
  }
}

function htmlBlockPlugin(): Plugin {
  return new Plugin({
    props: {
      nodeViews: {
        html_block: (node) => new HtmlBlockView(node),
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
