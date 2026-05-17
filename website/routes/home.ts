// "/" — the editor route. Loads README.md into a single live editor.
// Uses the public `createEditor` API end-to-end (dogfooding the npm
// surface from our own home page).

import { createEditor } from "../../src/lib.ts";
import { mountNav } from "../components/nav.ts";
import { onLocaleChange, t, translateTree } from "../i18n.ts";
import readme from "../../README.md?raw";

export function homeRoute(root: HTMLElement): () => void {
  const cleanupNav = mountNav(root, "/");

  const main = document.createElement("main");
  main.className = "page page-home";
  main.innerHTML = `
    <div class="editor-toolbar" role="toolbar" data-i18n-aria-label="home.toolbarLabel">
      <button type="button" data-action="open" data-i18n="home.open" data-i18n-title="home.openTitle"></button>
      <button type="button" data-action="save" data-i18n="home.save" data-i18n-title="home.saveTitle"></button>
      <button type="button" data-action="save-as" data-i18n="home.saveAs" data-i18n-title="home.saveAsTitle"></button>
      <span class="editor-toolbar-sep"></span>
      <button type="button" data-action="focus" data-i18n="home.focus" data-i18n-title="home.focusTitle"></button>
      <button type="button" data-action="typewriter" data-i18n="home.typewriter" data-i18n-title="home.typewriterTitle"></button>
      <span class="editor-toolbar-sep"></span>
      <button type="button" data-action="theme" data-i18n="home.theme" data-i18n-title="home.themeTitle"></button>
      <button type="button" data-action="clear-theme" data-i18n="home.clearTheme" data-i18n-title="home.clearThemeTitle"></button>
      <span class="editor-toolbar-status" aria-live="polite"></span>
      <input class="editor-theme-input" type="file" accept=".css,text/css" hidden />
    </div>
    <section class="hero-editor"></section>
    <p class="route-footer">
      <span data-i18n="home.footerPrefix"></span>
      <a href="#/specs" data-i18n="home.footerSpecs"></a>
      <span data-i18n="home.footerSuffix"></span>
    </p>
  `;
  root.append(main);

  const host = main.querySelector(".hero-editor") as HTMLElement;
  const editor = createEditor(host, { initialContent: readme });
  const toolbar = main.querySelector(".editor-toolbar") as HTMLElement;
  const status = main.querySelector(".editor-toolbar-status") as HTMLElement;
  const themeInput = main.querySelector(".editor-theme-input") as HTMLInputElement;
  let statusMessage: { key: string; vars?: Record<string, string | number | undefined> } | null = null;

  const setStatus = (key: string, vars?: Record<string, string | number | undefined>): void => {
    statusMessage = { key, vars };
    status.textContent = t(key, vars);
  };
  const updateToggles = (): void => {
    toolbar
      .querySelector('[data-action="focus"]')
      ?.classList.toggle("active", editor.isFocusMode());
    toolbar
      .querySelector('[data-action="typewriter"]')
      ?.classList.toggle("active", editor.isTypewriterMode());
  };
  const summarize = (
    result: { status: string; name?: string; message?: string },
  ): { key: string; vars?: Record<string, string | number | undefined> } => {
    if (result.status === "opened") return { key: "home.status.opened", vars: { name: result.name } };
    if (result.status === "saved") return { key: "home.status.saved", vars: { name: result.name } };
    if (result.status === "downloaded") return { key: "home.status.downloaded", vars: { name: result.name } };
    if (result.status === "cancelled") return { key: "home.status.cancelled" };
    if (result.status === "unsupported") return { key: "home.status.unsupported" };
    if (result.status === "error") {
      return result.message
        ? { key: "home.status.error", vars: { message: result.message } }
        : { key: "home.status.failed" };
    }
    return { key: "home.status.error", vars: { message: result.status } };
  };

  toolbar.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "open") {
      editor.openMarkdownFile().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "save") {
      editor.saveMarkdownFile().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "save-as") {
      editor.saveMarkdownFileAs().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "focus") {
      editor.toggleFocusMode();
      updateToggles();
    } else if (action === "typewriter") {
      editor.toggleTypewriterMode();
      updateToggles();
    } else if (action === "theme") {
      themeInput.click();
    } else if (action === "clear-theme") {
      editor.clearCustomTheme();
      setStatus("home.status.themeCleared");
    }
  });

  themeInput.addEventListener("change", () => {
    const file = themeInput.files?.[0];
    if (!file) return;
    editor.importThemeFile(file).then((result) => {
      if (result.status === "applied") {
        setStatus("home.status.themeApplied", { name: result.name });
      } else {
        setStatus("home.status.error", { message: result.message });
      }
      themeInput.value = "";
    });
  });
  const applyLocale = (): void => {
    translateTree(main);
    if (statusMessage) status.textContent = t(statusMessage.key, statusMessage.vars);
  };
  applyLocale();
  const cleanupLocale = onLocaleChange(applyLocale);
  updateToggles();

  return () => {
    cleanupLocale();
    cleanupNav();
    editor.destroy();
  };
}
