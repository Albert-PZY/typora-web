import type { Node as PMNode } from "prosemirror-model";
import { Plugin, PluginKey, type EditorState } from "prosemirror-state";

export type DocumentMetadata = {
  typoraRootUrl: string;
};

const metadataKey = new PluginKey<DocumentMetadata>("document-metadata");

function readFrontMatterValue(doc: PMNode, key: string): string {
  const first = doc.firstChild;
  if (!first || first.type.name !== "front_matter") return "";
  for (const line of first.textContent.split(/\r?\n/)) {
    const match = /^\s*([^:#]+?)\s*:\s*(.+?)\s*$/.exec(line);
    if (!match || match[1] !== key) continue;
    return match[2]!.replace(/^['"]|['"]$/g, "");
  }
  return "";
}

function readMetadata(doc: PMNode): DocumentMetadata {
  return {
    typoraRootUrl: readFrontMatterValue(doc, "typora-root-url"),
  };
}

export function documentMetadataPlugin(): Plugin<DocumentMetadata> {
  return new Plugin<DocumentMetadata>({
    key: metadataKey,
    state: {
      init: (_, state) => readMetadata(state.doc),
      apply: (tr, previous, _oldState, newState) =>
        tr.docChanged ? readMetadata(newState.doc) : previous,
    },
  });
}

export function getDocumentMetadata(state: EditorState): DocumentMetadata {
  return metadataKey.getState(state) ?? { typoraRootUrl: "" };
}
