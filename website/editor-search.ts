import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

import type { Editor } from "../src/lib.ts";
import { onLocaleChange, t, translateTree } from "./i18n.ts";

type SearchMatch = { from: number; to: number };

type SearchHighlightMeta = {
  matches: SearchMatch[];
  activeIndex: number;
  kind?: "match" | "replacement";
};

const searchHighlightKey = new PluginKey<DecorationSet>("website-search-highlights");
const searchHighlightPlugin = new Plugin<DecorationSet>({
  key: searchHighlightKey,
  state: {
    init: () => DecorationSet.empty,
    apply(transaction, current, _oldState, newState) {
      const meta = transaction.getMeta(searchHighlightKey) as SearchHighlightMeta | undefined;
      if (meta) {
        const decorations = meta.matches
          .filter((match) => match.from < match.to && match.to <= newState.doc.content.size)
          .map((match, index) => Decoration.inline(match.from, match.to, {
            class: [
              "editor-search-match",
              meta.kind === "replacement" ? "editor-search-replacement" : "",
              index === meta.activeIndex ? "editor-search-match-current" : "",
            ].filter(Boolean).join(" "),
            "data-search-match-index": String(index),
          }));
        return DecorationSet.create(newState.doc, decorations);
      }
      return transaction.docChanged
        ? current.map(transaction.mapping, transaction.doc)
        : current;
    },
  },
  props: {
    decorations(state) {
      return searchHighlightKey.getState(state) ?? DecorationSet.empty;
    },
  },
});

export type EditorSearch = {
  open(): void;
  close(): void;
  destroy(): void;
};

function findMatches(editor: Editor, query: string): SearchMatch[] {
  const needle = query.toLocaleLowerCase();
  if (!needle) return [];
  const matches: SearchMatch[] = [];
  editor.view.state.doc.descendants((node, position) => {
    if (!node.isText || !node.text) return;
    const text = node.text.toLocaleLowerCase();
    let offset = 0;
    while (offset <= text.length - needle.length) {
      const index = text.indexOf(needle, offset);
      if (index === -1) break;
      matches.push({ from: position + index, to: position + index + needle.length });
      offset = index + Math.max(1, needle.length);
    }
  });
  return matches;
}

export function mountEditorSearch(main: HTMLElement, editor: Editor): EditorSearch {
  const panel = document.createElement("form");
  panel.className = "editor-search-panel";
  panel.hidden = true;
  panel.setAttribute("role", "search");
  panel.innerHTML = `
    <label class="editor-search-field">
      <span class="visually-hidden" data-i18n="home.search.findLabel"></span>
      <input type="search" data-search-field="query" data-i18n-placeholder="home.search.findPlaceholder" autocomplete="off" spellcheck="false" />
    </label>
    <label class="editor-search-field editor-replace-field">
      <span class="visually-hidden" data-i18n="home.search.replaceLabel"></span>
      <input type="text" data-search-field="replacement" data-i18n-placeholder="home.search.replacePlaceholder" autocomplete="off" spellcheck="false" />
    </label>
    <span class="editor-search-count" aria-live="polite"></span>
    <button type="button" data-search-action="previous" data-i18n-title="home.search.previous" data-i18n-aria-label="home.search.previous">↑</button>
    <button type="button" data-search-action="next" data-i18n-title="home.search.next" data-i18n-aria-label="home.search.next">↓</button>
    <button type="button" data-search-action="replace" data-i18n="home.search.replace"></button>
    <button type="button" data-search-action="replace-all" data-i18n="home.search.replaceAll"></button>
    <button type="button" data-search-action="close" data-i18n-title="home.search.close" data-i18n-aria-label="home.search.close">×</button>
  `;
  main.append(panel);

  const queryInput = panel.querySelector<HTMLInputElement>('[data-search-field="query"]')!;
  const replacementInput = panel.querySelector<HTMLInputElement>('[data-search-field="replacement"]')!;
  const count = panel.querySelector<HTMLElement>(".editor-search-count")!;
  let matches: SearchMatch[] = [];
  let activeIndex = -1;

  const clearNodeViewHighlight = (): void => {
    for (const element of editor.view.dom.querySelectorAll(".editor-search-node-current")) {
      element.classList.remove("editor-search-node-current");
    }
  };

  const ensureHighlightPlugin = (): void => {
    const view = editor.view;
    if (searchHighlightKey.getState(view.state) !== undefined) return;
    view.updateState(view.state.reconfigure({
      plugins: [...view.state.plugins, searchHighlightPlugin],
    }));
  };

  const updateHighlights = (kind: SearchHighlightMeta["kind"] = "match"): void => {
    clearNodeViewHighlight();
    ensureHighlightPlugin();
    editor.view.dispatch(editor.view.state.tr.setMeta(searchHighlightKey, {
      matches,
      activeIndex,
      kind,
    } satisfies SearchHighlightMeta));
  };

  const scrollElementToCenter = (element: Element | null): boolean => {
    if (!(element instanceof HTMLElement) || typeof element.scrollIntoView !== "function") {
      return false;
    }
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 && bounds.height <= 0) return false;
    element.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "auto",
    });
    return true;
  };

  const scrollRenderedAncestorToCenter = (start: Element | null): boolean => {
    let element = start;
    while (element) {
      if (scrollElementToCenter(element)) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  const scrollPositionToCenter = (position: number, highlightNodeView = false): void => {
    try {
      const clamped = Math.max(0, Math.min(position, editor.view.state.doc.content.size));
      const target = editor.view.domAtPos(clamped).node;
      const start = target instanceof Element ? target : target.parentElement;
      const nodeView = highlightNodeView
        ? start?.closest<HTMLElement>('[contenteditable="false"]') ?? null
        : null;
      if (nodeView) {
        nodeView.classList.add("editor-search-node-current");
        if (!scrollElementToCenter(nodeView)) scrollRenderedAncestorToCenter(nodeView.parentElement);
        return;
      }
      scrollRenderedAncestorToCenter(start);
    } catch {}
  };

  const scrollActiveMatchToCenter = (match: SearchMatch): void => {
    clearNodeViewHighlight();
    const highlighted = editor.view.dom.querySelector(".editor-search-match-current");
    if (scrollElementToCenter(highlighted)) return;
    const nodeView = highlighted?.closest<HTMLElement>('[contenteditable="false"]') ?? null;
    if (nodeView) {
      nodeView.classList.add("editor-search-node-current");
      if (!scrollElementToCenter(nodeView)) scrollRenderedAncestorToCenter(nodeView.parentElement);
      return;
    }
    if (scrollRenderedAncestorToCenter(highlighted?.parentElement ?? null)) return;
    scrollPositionToCenter(match.from, true);
  };

  const renderCount = (replacementCount?: number): void => {
    if (replacementCount !== undefined) {
      count.textContent = t("home.search.replaced", { count: replacementCount });
    } else if (!queryInput.value) {
      count.textContent = "";
    } else if (matches.length === 0) {
      count.textContent = t("home.search.noResults");
    } else {
      count.textContent = t("home.search.position", {
        current: activeIndex + 1,
        count: matches.length,
      });
    }
  };

  const selectMatch = (index: number): void => {
    matches = findMatches(editor, queryInput.value);
    if (matches.length === 0) {
      activeIndex = -1;
      updateHighlights();
      renderCount();
      return;
    }
    activeIndex = ((index % matches.length) + matches.length) % matches.length;
    const match = matches[activeIndex]!;
    ensureHighlightPlugin();
    const transaction = editor.view.state.tr
      .setSelection(TextSelection.create(editor.view.state.doc, match.from, match.to))
      .setMeta(searchHighlightKey, { matches, activeIndex } satisfies SearchHighlightMeta)
      .scrollIntoView();
    editor.view.dispatch(transaction);
    scrollActiveMatchToCenter(match);
    renderCount();
  };

  const refresh = (): void => {
    matches = findMatches(editor, queryInput.value);
    activeIndex = matches.length > 0 ? 0 : -1;
    if (activeIndex >= 0) selectMatch(activeIndex);
    else {
      updateHighlights();
      renderCount();
    }
  };

  const replaceCurrent = (): void => {
    matches = findMatches(editor, queryInput.value);
    if (matches.length === 0) {
      activeIndex = -1;
      updateHighlights();
      renderCount();
      return;
    }
    const index = activeIndex < 0 ? 0 : Math.min(activeIndex, matches.length - 1);
    const match = matches[index]!;
    editor.view.dispatch(editor.view.state.tr
      .insertText(replacementInput.value, match.from, match.to)
      .scrollIntoView());
    matches = findMatches(editor, queryInput.value);
    if (matches.length > 0) selectMatch(Math.min(index, matches.length - 1));
    else {
      matches = replacementInput.value
        ? [{ from: match.from, to: match.from + replacementInput.value.length }]
        : [];
      activeIndex = matches.length > 0 ? 0 : -1;
      updateHighlights("replacement");
      if (matches[0]) scrollActiveMatchToCenter(matches[0]);
      else scrollPositionToCenter(match.from);
      renderCount(1);
    }
  };

  const replaceAll = (): void => {
    matches = findMatches(editor, queryInput.value);
    if (matches.length === 0) {
      activeIndex = -1;
      updateHighlights();
      renderCount();
      return;
    }
    const replacementCount = matches.length;
    const firstMatchPosition = matches[0]!.from;
    let offset = 0;
    const replacementMatches = replacementInput.value
      ? matches.map((match) => {
        const from = match.from + offset;
        offset += replacementInput.value.length - (match.to - match.from);
        return { from, to: from + replacementInput.value.length };
      })
      : [];
    let transaction = editor.view.state.tr;
    for (const match of [...matches].reverse()) {
      transaction = transaction.insertText(replacementInput.value, match.from, match.to);
    }
    editor.view.dispatch(transaction.scrollIntoView());
    matches = replacementMatches;
    activeIndex = matches.length > 0 ? 0 : -1;
    updateHighlights("replacement");
    if (matches[0]) scrollActiveMatchToCenter(matches[0]);
    else scrollPositionToCenter(firstMatchPosition);
    renderCount(replacementCount);
  };

  const close = (): void => {
    if (panel.hidden) return;
    panel.hidden = true;
    matches = [];
    activeIndex = -1;
    updateHighlights();
    editor.focus();
  };

  const onClick = (event: MouseEvent): void => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-search-action]")
      ?.dataset.searchAction;
    if (!action) return;
    if (action === "previous") selectMatch(activeIndex - 1);
    else if (action === "next") selectMatch(activeIndex + 1);
    else if (action === "replace") replaceCurrent();
    else if (action === "replace-all") replaceAll();
    else if (action === "close") close();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Enter" && event.target === queryInput) {
      event.preventDefault();
      selectMatch(activeIndex + (event.shiftKey ? -1 : 1));
    }
  };
  const onSubmit = (event: SubmitEvent): void => event.preventDefault();

  panel.addEventListener("click", onClick);
  panel.addEventListener("keydown", onKeyDown);
  panel.addEventListener("submit", onSubmit);
  queryInput.addEventListener("input", refresh);
  translateTree(panel);
  const cleanupLocale = onLocaleChange(() => {
    translateTree(panel);
    renderCount();
  });

  return {
    open(): void {
      if (editor.isSourceMode()) editor.toggleSource();
      panel.hidden = false;
      const selected = editor.view.state.selection.empty
        ? ""
        : editor.view.state.doc.textBetween(
          editor.view.state.selection.from,
          editor.view.state.selection.to,
          " ",
          " ",
        );
      if (selected && !selected.includes("\n")) queryInput.value = selected;
      queryInput.focus();
      queryInput.select();
      refresh();
    },
    close,
    destroy(): void {
      matches = [];
      activeIndex = -1;
      updateHighlights();
      cleanupLocale();
      panel.removeEventListener("click", onClick);
      panel.removeEventListener("keydown", onKeyDown);
      panel.removeEventListener("submit", onSubmit);
      queryInput.removeEventListener("input", refresh);
      panel.remove();
    },
  };
}
