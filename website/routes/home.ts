// "/" - the editor route. Loads a localized demo document into a single live editor.
// Uses the public `createEditor` API end-to-end (dogfooding the npm
// surface from our own home page).

import { createEditor } from "../../src/lib.ts";
import { mountNav } from "../components/nav.ts";
import { getHomeDemoMarkdown } from "../demo-content.ts";
import { mountEditorShell } from "../editor-shell.ts";
import { getLocale, onLocaleChange, t, translateTree } from "../i18n.ts";

export function homeRoute(root: HTMLElement): () => void {
  const cleanupNav = mountNav(root, "/");

  const main = document.createElement("main");
  main.className = "page page-home";
  main.innerHTML = `
    <aside class="editor-sidebar" aria-hidden="true">
      <div class="editor-sidebar-tabs"></div>
      <div class="editor-sidebar-body"></div>
    </aside>
    <div class="editor-workspace">
      <section class="hero-editor"></section>
    </div>
    <footer class="editor-statusbar">
      <div class="editor-statusbar-left editor-fixed-controls-left">
        <button type="button" data-shell-action="sidebar-toggle" data-i18n-title="home.menu.sidebar" data-i18n-aria-label="home.menu.sidebar">‹</button>
        <button type="button" data-shell-action="source" data-i18n-title="home.menu.source" data-i18n-aria-label="home.menu.source">&lt;/&gt;</button>
      </div>
      <span class="editor-toolbar-status" aria-live="polite"></span>
      <div class="editor-statusbar-right editor-fixed-controls-right">
        <button type="button" class="editor-word-count"></button>
        <div class="editor-stats-popover" hidden></div>
      </div>
    </footer>
    <p class="route-footer">
      <span data-i18n="home.footerPrefix"></span>
      <a href="#/specs" data-i18n="home.footerSpecs"></a>
      <span data-i18n="home.footerSuffix"></span>
    </p>
  `;
  root.append(main);

  const host = main.querySelector(".hero-editor") as HTMLElement;
  let demoLocale = getLocale();
  const editor = createEditor(host, { initialContent: getHomeDemoMarkdown(demoLocale) });
  let lastDemoMarkdown = editor.getMarkdown();
  const status = main.querySelector(".editor-toolbar-status") as HTMLElement;
  let statusMessage: { key: string; vars?: Record<string, string | number | undefined> } | null = null;

  const setStatus = (key: string, vars?: Record<string, string | number | undefined>): void => {
    statusMessage = { key, vars };
    status.textContent = t(key, vars);
  };
  const switchDemoIfUntouched = (): void => {
    const nextLocale = getLocale();
    if (nextLocale === demoLocale) return;

    if (editor.getMarkdown() === lastDemoMarkdown) {
      editor.setMarkdown(getHomeDemoMarkdown(nextLocale));
      lastDemoMarkdown = editor.getMarkdown();
    }
    demoLocale = nextLocale;
  };
  const cleanupShell = mountEditorShell({
    root,
    main,
    editor,
    host,
    setStatus,
  });

  const applyLocale = (): void => {
    translateTree(main);
    if (statusMessage) status.textContent = t(statusMessage.key, statusMessage.vars);
    switchDemoIfUntouched();
  };
  applyLocale();
  const cleanupLocale = onLocaleChange(applyLocale);

  return () => {
    cleanupLocale();
    cleanupNav();
    cleanupShell();
    editor.destroy();
  };
}
