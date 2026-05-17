// "/" - the editor route. Loads a localized demo document into a single live editor.
// Uses the public `createEditor` API end-to-end (dogfooding the npm
// surface from our own home page).

import { createEditor } from "../../src/lib.ts";
import { mountNav } from "../components/nav.ts";
import { getHomeDemoMarkdown } from "../demo-content.ts";
import { getLocale, onLocaleChange, t, translateTree } from "../i18n.ts";

const MENU_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>`;

export function homeRoute(root: HTMLElement): () => void {
  const cleanupNav = mountNav(root, "/");

  const main = document.createElement("main");
  main.className = "page page-home";
  main.innerHTML = `
    <div class="editor-toolbar" role="toolbar" data-i18n-aria-label="home.toolbarLabel">
      <button class="editor-toolbar-menu-button" type="button" data-action="menu" aria-expanded="false" data-i18n-title="home.toolbarLabel" data-i18n-aria-label="home.toolbarLabel">${MENU_ICON}</button>
      <div class="editor-toolbar-menu" role="menu" hidden>
        <button type="button" data-action="open" role="menuitem" data-i18n="home.open" data-i18n-title="home.openTitle"></button>
        <button type="button" data-action="save" role="menuitem" data-i18n="home.save" data-i18n-title="home.saveTitle"></button>
        <button type="button" data-action="save-as" role="menuitem" data-i18n="home.saveAs" data-i18n-title="home.saveAsTitle"></button>
        <button type="button" data-action="focus" role="menuitem" data-i18n="home.focus" data-i18n-title="home.focusTitle"></button>
        <button type="button" data-action="typewriter" role="menuitem" data-i18n="home.typewriter" data-i18n-title="home.typewriterTitle"></button>
      </div>
      <span class="editor-toolbar-status" aria-live="polite"></span>
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
  let demoLocale = getLocale();
  const editor = createEditor(host, { initialContent: getHomeDemoMarkdown(demoLocale) });
  let lastDemoMarkdown = editor.getMarkdown();
  const toolbar = main.querySelector(".editor-toolbar") as HTMLElement;
  const toolbarMenu = toolbar.querySelector(".editor-toolbar-menu") as HTMLElement;
  const toolbarMenuButton = toolbar.querySelector<HTMLButtonElement>('[data-action="menu"]')!;
  const status = main.querySelector(".editor-toolbar-status") as HTMLElement;
  let statusMessage: { key: string; vars?: Record<string, string | number | undefined> } | null = null;

  const setMenuOpen = (open: boolean): void => {
    toolbarMenu.hidden = !open;
    toolbarMenuButton.setAttribute("aria-expanded", String(open));
  };
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
    if (action === "menu") {
      setMenuOpen(toolbarMenu.hasAttribute("hidden"));
    } else if (action === "open") {
      setMenuOpen(false);
      editor.openMarkdownFile().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "save") {
      setMenuOpen(false);
      editor.saveMarkdownFile().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "save-as") {
      setMenuOpen(false);
      editor.saveMarkdownFileAs().then((result) => {
        const message = summarize(result);
        setStatus(message.key, message.vars);
      });
    } else if (action === "focus") {
      setMenuOpen(false);
      editor.toggleFocusMode();
      updateToggles();
    } else if (action === "typewriter") {
      setMenuOpen(false);
      editor.toggleTypewriterMode();
      updateToggles();
    }
  });
  const closeMenuOnOutsideMouseDown = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target && toolbar.contains(target)) return;
    setMenuOpen(false);
  };
  document.addEventListener("mousedown", closeMenuOnOutsideMouseDown);

  const applyLocale = (): void => {
    translateTree(main);
    if (statusMessage) status.textContent = t(statusMessage.key, statusMessage.vars);
    switchDemoIfUntouched();
  };
  applyLocale();
  const cleanupLocale = onLocaleChange(applyLocale);
  updateToggles();

  return () => {
    cleanupLocale();
    cleanupNav();
    document.removeEventListener("mousedown", closeMenuOnOutsideMouseDown);
    editor.destroy();
  };
}
