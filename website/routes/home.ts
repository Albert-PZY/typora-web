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
    <div class="editor-menu-bar" role="menubar" data-i18n-aria-label="home.toolbarLabel"></div>
    <div class="editor-workspace">
      <aside class="editor-sidebar" hidden>
        <div class="editor-sidebar-tabs"></div>
        <div class="editor-sidebar-body"></div>
      </aside>
      <section class="hero-editor"></section>
    </div>
    <footer class="editor-statusbar">
      <div class="editor-statusbar-left">
        <button type="button" data-shell-action="sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar">‹</button>
        <button type="button" data-shell-action="source" title="Toggle source mode" aria-label="Toggle source mode">&lt;/&gt;</button>
      </div>
      <span class="editor-toolbar-status" aria-live="polite"></span>
      <div class="editor-statusbar-right">
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
    getStatus: () => status.textContent ?? "",
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
