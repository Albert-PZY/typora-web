// "/" — the editor route. Loads README.md into a single live editor.
// Uses the public `createEditor` API end-to-end (dogfooding the npm
// surface from our own home page).

import { createEditor } from "../../src/lib.ts";
import { mountNav } from "../components/nav.ts";
import readme from "../../README.md?raw";

export function homeRoute(root: HTMLElement): () => void {
  mountNav(root, "/");

  const main = document.createElement("main");
  main.className = "page page-home";
  main.innerHTML = `
    <div class="editor-toolbar" role="toolbar" aria-label="Editor tools">
      <button type="button" data-action="open" title="Open Markdown">Open</button>
      <button type="button" data-action="save" title="Save Markdown">Save</button>
      <button type="button" data-action="save-as" title="Save As">Save As</button>
      <span class="editor-toolbar-sep"></span>
      <button type="button" data-action="focus" title="Focus Mode">Focus</button>
      <button type="button" data-action="typewriter" title="Typewriter Mode">Typewriter</button>
      <span class="editor-toolbar-sep"></span>
      <button type="button" data-action="theme" title="Import Typora Theme">Theme</button>
      <button type="button" data-action="clear-theme" title="Clear Theme">Clear</button>
      <span class="editor-toolbar-status" aria-live="polite"></span>
      <input class="editor-theme-input" type="file" accept=".css,text/css" hidden />
    </div>
    <section class="hero-editor"></section>
    <p class="route-footer">
      The text above is editable. <a href="#/specs">Browse specs</a> for
      the full Typora-compatibility catalog.
    </p>
  `;
  root.append(main);

  const host = main.querySelector(".hero-editor") as HTMLElement;
  const editor = createEditor(host, { initialContent: readme });
  const toolbar = main.querySelector(".editor-toolbar") as HTMLElement;
  const status = main.querySelector(".editor-toolbar-status") as HTMLElement;
  const themeInput = main.querySelector(".editor-theme-input") as HTMLInputElement;

  const setStatus = (text: string): void => {
    status.textContent = text;
  };
  const updateToggles = (): void => {
    toolbar
      .querySelector('[data-action="focus"]')
      ?.classList.toggle("active", editor.isFocusMode());
    toolbar
      .querySelector('[data-action="typewriter"]')
      ?.classList.toggle("active", editor.isTypewriterMode());
  };
  const summarize = (result: { status: string; name?: string; message?: string }): string => {
    if (result.status === "opened") return `Opened ${result.name}`;
    if (result.status === "saved") return `Saved ${result.name}`;
    if (result.status === "downloaded") return `Downloaded ${result.name}`;
    if (result.status === "cancelled") return "Cancelled";
    if (result.status === "unsupported") return "Not supported in this browser";
    if (result.status === "error") return result.message ?? "Operation failed";
    return result.status;
  };

  toolbar.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "open") {
      editor.openMarkdownFile().then((result) => setStatus(summarize(result)));
    } else if (action === "save") {
      editor.saveMarkdownFile().then((result) => setStatus(summarize(result)));
    } else if (action === "save-as") {
      editor.saveMarkdownFileAs().then((result) => setStatus(summarize(result)));
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
      setStatus("Theme cleared");
    }
  });

  themeInput.addEventListener("change", () => {
    const file = themeInput.files?.[0];
    if (!file) return;
    editor.importThemeFile(file).then((result) => {
      setStatus(result.status === "applied" ? `Theme ${result.name}` : result.message);
      themeInput.value = "";
    });
  });
  updateToggles();

  return () => {
    editor.destroy();
  };
}
