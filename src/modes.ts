import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

type FocusModeState = { enabled: boolean };

const focusModeKey = new PluginKey<FocusModeState>("focus-mode");

export function focusModePlugin(): Plugin<FocusModeState> {
  return new Plugin<FocusModeState>({
    key: focusModeKey,
    state: {
      init: () => ({ enabled: false }),
      apply(tr, value) {
        const meta = tr.getMeta(focusModeKey) as FocusModeState | undefined;
        return meta ?? value;
      },
    },
    props: {
      decorations(state) {
        const mode = focusModeKey.getState(state);
        if (!mode?.enabled || !state.selection.empty) return null;
        const activePos = state.selection.from;
        const decos: Decoration[] = [];
        state.doc.descendants((node, pos) => {
          if (!node.isBlock) return true;
          const active = activePos >= pos && activePos <= pos + node.nodeSize;
          decos.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: active ? "tw-focus-active" : "tw-focus-muted",
            }),
          );
          return false;
        });
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
}

export function setFocusMode(
  state: import("prosemirror-state").EditorState,
  dispatch: (tr: import("prosemirror-state").Transaction) => void,
  enabled: boolean,
): void {
  dispatch(state.tr.setMeta(focusModeKey, { enabled }));
}

export function isFocusMode(state: import("prosemirror-state").EditorState): boolean {
  return focusModeKey.getState(state)?.enabled ?? false;
}
