import { TextSelection } from "prosemirror-state";

import type { Editor } from "../src/lib.ts";
import { onLocaleChange, t, translateTree } from "./i18n.ts";

type SearchMatch = { from: number; to: number };

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
      renderCount();
      return;
    }
    activeIndex = ((index % matches.length) + matches.length) % matches.length;
    const match = matches[activeIndex]!;
    const transaction = editor.view.state.tr
      .setSelection(TextSelection.create(editor.view.state.doc, match.from, match.to))
      .scrollIntoView();
    editor.view.dispatch(transaction);
    renderCount();
  };

  const refresh = (): void => {
    matches = findMatches(editor, queryInput.value);
    activeIndex = matches.length > 0 ? 0 : -1;
    if (activeIndex >= 0) selectMatch(activeIndex);
    else renderCount();
  };

  const replaceCurrent = (): void => {
    matches = findMatches(editor, queryInput.value);
    if (matches.length === 0) {
      activeIndex = -1;
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
      activeIndex = -1;
      renderCount(1);
    }
  };

  const replaceAll = (): void => {
    matches = findMatches(editor, queryInput.value);
    if (matches.length === 0) {
      activeIndex = -1;
      renderCount();
      return;
    }
    const replacementCount = matches.length;
    let transaction = editor.view.state.tr;
    for (const match of [...matches].reverse()) {
      transaction = transaction.insertText(replacementInput.value, match.from, match.to);
    }
    editor.view.dispatch(transaction.scrollIntoView());
    matches = findMatches(editor, queryInput.value);
    activeIndex = -1;
    renderCount(replacementCount);
  };

  const close = (): void => {
    if (panel.hidden) return;
    panel.hidden = true;
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
      cleanupLocale();
      panel.removeEventListener("click", onClick);
      panel.removeEventListener("keydown", onKeyDown);
      panel.removeEventListener("submit", onSubmit);
      queryInput.removeEventListener("input", refresh);
      panel.remove();
    },
  };
}
