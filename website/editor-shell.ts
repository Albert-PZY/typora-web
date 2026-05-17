import type { Editor } from "../src/lib.ts";
import { pickMarkdownDirectory, type MarkdownTreeEntry } from "../src/local-files.ts";
import { getEditorStats } from "./editor-stats.ts";
import { t, translateTree } from "./i18n.ts";

type ShellOptions = {
  root: HTMLElement;
  main: HTMLElement;
  editor: Editor;
  host: HTMLElement;
  getStatus(): string;
  setStatus(key: string, vars?: Record<string, string | number | undefined>): void;
};

const MENU_GROUPS = [
  {
    key: "file",
    label: "home.menu.file",
    items: [
      ["new", "home.menu.new", "Ctrl+N"],
      ["new-window", "home.menu.newWindow", "Ctrl+Shift+N"],
      ["open", "home.open", "Ctrl+O"],
      ["open-folder", "home.menu.openFolder", ""],
      ["save", "home.save", "Ctrl+S"],
      ["save-as", "home.saveAs", "Ctrl+Shift+S"],
      ["import", "home.menu.import", ""],
      ["export", "home.menu.export", ""],
      ["print", "home.menu.print", "Alt+Shift+P"],
      ["close", "home.menu.close", "Ctrl+W"],
    ],
  },
  {
    key: "edit",
    label: "home.menu.edit",
    items: [
      ["undo", "home.menu.undo", "Ctrl+Z"],
      ["redo", "home.menu.redo", "Ctrl+Y"],
      ["cut", "home.menu.cut", "Ctrl+X"],
      ["copy", "home.menu.copy", "Ctrl+C"],
      ["paste", "home.menu.paste", "Ctrl+V"],
      ["copy-markdown", "home.menu.copyMarkdown", "Ctrl+Shift+C"],
      ["paste-text", "home.menu.pasteText", "Ctrl+Shift+V"],
      ["select-all", "home.menu.selectAll", "Ctrl+A"],
      ["find", "home.menu.find", "Ctrl+F"],
    ],
  },
  {
    key: "paragraph",
    label: "home.menu.paragraph",
    items: [
      ["heading-1", "home.menu.heading1", "Ctrl+1"],
      ["heading-2", "home.menu.heading2", "Ctrl+2"],
      ["heading-3", "home.menu.heading3", "Ctrl+3"],
      ["paragraph", "home.menu.paragraphText", "Ctrl+0"],
      ["math-block", "home.menu.mathBlock", "Ctrl+Shift+M"],
      ["code-block", "home.menu.codeBlock", "Ctrl+Shift+K"],
      ["quote", "home.menu.quote", "Ctrl+Shift+Q"],
      ["ordered-list", "home.menu.orderedList", "Ctrl+Shift+["],
      ["bullet-list", "home.menu.bulletList", "Ctrl+Shift+]"],
      ["task-list", "home.menu.taskList", "Ctrl+Shift+X"],
    ],
  },
  {
    key: "format",
    label: "home.menu.format",
    items: [
      ["bold", "home.menu.bold", "Ctrl+B"],
      ["italic", "home.menu.italic", "Ctrl+I"],
      ["underline", "home.menu.underline", "Ctrl+U"],
      ["inline-code", "home.menu.inlineCode", "Ctrl+Shift+`"],
      ["inline-math", "home.menu.inlineMath", ""],
      ["strike", "home.menu.strike", "Alt+Shift+5"],
      ["highlight", "home.menu.highlight", ""],
      ["link", "home.menu.link", "Ctrl+K"],
      ["image", "home.menu.image", ""],
      ["clear-style", "home.menu.clearStyle", "Ctrl+\\"],
    ],
  },
  {
    key: "view",
    label: "home.menu.view",
    items: [
      ["sidebar", "home.menu.sidebar", "Ctrl+Shift+L"],
      ["outline", "home.menu.outline", "Ctrl+Shift+1"],
      ["file-tree", "home.menu.fileTree", "Ctrl+Shift+3"],
      ["search", "home.menu.search", "Ctrl+Shift+F"],
      ["source", "home.menu.source", "Ctrl+/"],
      ["focus", "home.focus", "F8"],
      ["typewriter", "home.typewriter", "F9"],
      ["statusbar", "home.menu.statusbar", ""],
      ["fullscreen", "home.menu.fullscreen", "F11"],
    ],
  },
] as const;

const DEFAULT_TREE: MarkdownTreeEntry = {
  name: "typora-web",
  path: "typora-web",
  kind: "directory",
  children: [
    {
      name: "learn",
      path: "typora-web/learn",
      kind: "directory",
      children: [
        { name: "demo.md", path: "typora-web/learn/demo.md", kind: "file" },
        { name: "commonmark.md", path: "typora-web/learn/commonmark.md", kind: "file" },
      ],
    },
  ],
};

export function mountEditorShell(options: ShellOptions): () => void {
  const { root, main, editor, host, setStatus } = options;
  let sidebarMode: "files" | "outline" = "files";
  let sidebarOpen = false;
  let statusbarOpen = true;
  let currentTree = DEFAULT_TREE;
  let statsOpen = false;

  const menuBar = root.querySelector(".editor-menu-bar") as HTMLElement;
  const sidebar = main.querySelector(".editor-sidebar") as HTMLElement;
  const sidebarTabs = sidebar.querySelector(".editor-sidebar-tabs") as HTMLElement;
  const sidebarBody = sidebar.querySelector(".editor-sidebar-body") as HTMLElement;
  const statusbar = main.querySelector(".editor-statusbar") as HTMLElement;
  const sourceButton = statusbar.querySelector<HTMLButtonElement>('[data-shell-action="source"]')!;
  const sidebarButton = statusbar.querySelector<HTMLButtonElement>('[data-shell-action="sidebar-toggle"]')!;
  const wordButton = statusbar.querySelector<HTMLButtonElement>(".editor-word-count")!;
  const statsPanel = statusbar.querySelector<HTMLElement>(".editor-stats-popover")!;

  function renderMenuChecks(): void {
    for (const item of menuBar.querySelectorAll<HTMLElement>("[data-menu-action]")) {
      item.classList.toggle("checked", (
        (item.dataset.menuAction === "focus" && editor.isFocusMode()) ||
        (item.dataset.menuAction === "typewriter" && editor.isTypewriterMode()) ||
        (item.dataset.menuAction === "source" && editor.isSourceMode()) ||
        (item.dataset.menuAction === "statusbar" && statusbarOpen) ||
        (item.dataset.menuAction === "sidebar" && sidebarOpen) ||
        (item.dataset.menuAction === "file-tree" && sidebarOpen && sidebarMode === "files") ||
        (item.dataset.menuAction === "outline" && sidebarOpen && sidebarMode === "outline")
      ));
    }
    sourceButton.classList.toggle("active", editor.isSourceMode());
    sidebarButton.classList.toggle("active", sidebarOpen);
  }

  function buildMenus(): void {
    menuBar.innerHTML = MENU_GROUPS.map((group) => `
      <div class="editor-menu-group">
        <button type="button" class="editor-menu-button" data-menu="${group.key}" data-i18n="${group.label}"></button>
        <div class="editor-menu-dropdown" role="menu" hidden>
          ${group.items.map(([action, label, shortcut]) => `
            <button type="button" role="menuitem" data-menu-action="${action}">
              <span class="editor-menu-check"></span>
              <span data-i18n="${label}"></span>
              <kbd>${shortcut}</kbd>
            </button>
          `).join("")}
        </div>
      </div>
    `).join("");
    translateTree(menuBar);
  }

  function setMenuOpen(button: HTMLButtonElement | null): void {
    for (const group of menuBar.querySelectorAll<HTMLElement>(".editor-menu-group")) {
      const owns = button && group.contains(button);
      group.querySelector<HTMLElement>(".editor-menu-dropdown")!.hidden = !owns;
      group.classList.toggle("open", !!owns);
    }
  }

  function renderTreeEntry(entry: MarkdownTreeEntry): string {
    if (entry.kind === "file") {
      return `<li><button type="button" class="tree-file" data-file-path="${entry.path}"><span class="tree-icon">□</span>${entry.name}</button></li>`;
    }
    return `<li><div class="tree-dir"><span class="tree-icon">■</span>${entry.name}</div><ul>${(entry.children ?? []).map(renderTreeEntry).join("")}</ul></li>`;
  }

  function headingItems(): Array<{ level: number; text: string }> {
    const items: Array<{ level: number; text: string }> = [];
    editor.view.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        items.push({ level: Number(node.attrs.level ?? 1), text: node.textContent });
      }
    });
    return items;
  }

  function renderSidebar(): void {
    main.classList.toggle("sidebar-open", sidebarOpen);
    sidebar.hidden = !sidebarOpen;
    sidebarTabs.innerHTML = `
      <button type="button" data-sidebar-mode="files" class="${sidebarMode === "files" ? "active" : ""}" data-i18n="home.sidebar.files"></button>
      <button type="button" data-sidebar-mode="outline" class="${sidebarMode === "outline" ? "active" : ""}" data-i18n="home.sidebar.outline"></button>
    `;
    if (sidebarMode === "files") {
      sidebarBody.innerHTML = `<ul class="editor-file-tree">${renderTreeEntry(currentTree)}</ul>`;
    } else {
      const headings = headingItems();
      sidebarBody.innerHTML = headings.length
        ? `<ol class="editor-outline">${headings.map((h) => `<li class="outline-level-${h.level}">${h.text}</li>`).join("")}</ol>`
        : `<p class="editor-sidebar-empty" data-i18n="home.sidebar.emptyOutline"></p>`;
    }
    translateTree(sidebar);
    renderMenuChecks();
  }

  function renderStats(): void {
    const stats = getEditorStats(editor.getMarkdown());
    wordButton.textContent = t("home.stats.words", { count: stats.words });
    statsPanel.innerHTML = `
      <div data-i18n="home.stats.title"></div>
      <dl>
        <div><dt>${stats.readingMinutes}</dt><dd data-i18n="home.stats.minutes"></dd></div>
        <div><dt>${stats.lines}</dt><dd data-i18n="home.stats.lines"></dd></div>
        <div><dt>${stats.words}</dt><dd data-i18n="home.stats.wordsLabel"></dd></div>
        <div><dt>${stats.characters}</dt><dd data-i18n="home.stats.characters"></dd></div>
      </dl>
    `;
    translateTree(statsPanel);
    statsPanel.hidden = !statsOpen;
    statusbar.hidden = !statusbarOpen;
  }

  function openSidebar(mode: "files" | "outline"): void {
    sidebarMode = mode;
    sidebarOpen = true;
    renderSidebar();
  }

  async function openFolder(): Promise<void> {
    openSidebar("files");
    const result = await pickMarkdownDirectory();
    if (result.status === "picked") {
      currentTree = result.tree;
      setStatus("home.status.folderOpened", { name: result.tree.name });
      renderSidebar();
    } else if (result.status === "unsupported") {
      setStatus("home.status.folderUnsupported");
    } else if (result.status === "error") {
      setStatus("home.status.error", { message: result.message });
    }
  }

  function runMenuAction(action: string): void {
    setMenuOpen(null);
    if (action === "open") void editor.openMarkdownFile().then((result) => {
      if (result.status === "opened") setStatus("home.status.opened", { name: result.name });
      else if (result.status === "unsupported") setStatus("home.status.unsupported");
      else if (result.status === "cancelled") setStatus("home.status.cancelled");
      else if (result.status === "error") setStatus("home.status.error", { message: result.message });
      renderStats();
    });
    else if (action === "open-folder") void openFolder();
    else if (action === "save") void editor.saveMarkdownFile().then((result) => {
      if (result.status === "saved" || result.status === "downloaded") setStatus(`home.status.${result.status}`, { name: result.name });
      renderStats();
    });
    else if (action === "save-as") void editor.saveMarkdownFileAs().then((result) => {
      if (result.status === "saved" || result.status === "downloaded") setStatus(`home.status.${result.status}`, { name: result.name });
      renderStats();
    });
    else if (action === "focus") editor.toggleFocusMode();
    else if (action === "typewriter") editor.toggleTypewriterMode();
    else if (action === "source") editor.toggleSource();
    else if (action === "sidebar") sidebarOpen ? (sidebarOpen = false, renderSidebar()) : openSidebar(sidebarMode);
    else if (action === "file-tree") openSidebar("files");
    else if (action === "outline") openSidebar("outline");
    else if (action === "statusbar") statusbarOpen = !statusbarOpen;
    else if (action === "select-all") document.execCommand("selectAll");
    else if (["undo", "redo", "cut", "copy", "paste"].includes(action)) document.execCommand(action);
    else setStatus("home.status.notImplemented");
    renderMenuChecks();
    renderStats();
  }

  const onMenuClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const menuButton = target.closest<HTMLButtonElement>(".editor-menu-button");
    if (menuButton) {
      const group = menuButton.closest(".editor-menu-group") as HTMLElement;
      const open = group.classList.contains("open");
      setMenuOpen(open ? null : menuButton);
      return;
    }
    const item = target.closest<HTMLButtonElement>("[data-menu-action]");
    if (item?.dataset.menuAction) runMenuAction(item.dataset.menuAction);
  };

  const onSidebarClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const tab = target.closest<HTMLButtonElement>("[data-sidebar-mode]");
    if (tab?.dataset.sidebarMode === "files" || tab?.dataset.sidebarMode === "outline") {
      openSidebar(tab.dataset.sidebarMode);
    }
  };

  const onStatusClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const action = target.closest<HTMLButtonElement>("[data-shell-action]")?.dataset.shellAction;
    if (action === "sidebar-toggle") {
      sidebarOpen = !sidebarOpen;
      renderSidebar();
    } else if (action === "source") {
      editor.toggleSource();
      renderMenuChecks();
    } else if (target.closest(".editor-word-count")) {
      statsOpen = !statsOpen;
      renderStats();
    }
  };

  const onDocumentMouseDown = (event: MouseEvent): void => {
    const target = event.target as Node | null;
    if (target && (menuBar.contains(target) || statusbar.contains(target))) return;
    setMenuOpen(null);
    statsOpen = false;
    renderStats();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!host.contains(event.target as Node | null) && event.target !== document.body) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod && event.key !== "F8" && event.key !== "F9") return;
    const key = event.key.toLowerCase();
    const guarded = (
      (mod && ["/", "s", "o", "f", "b", "i", "k"].includes(key)) ||
      (mod && event.shiftKey && ["l", "1", "3"].includes(key)) ||
      event.key === "F8" ||
      event.key === "F9"
    );
    if (!guarded) return;
    event.preventDefault();
    if (mod && event.shiftKey && key === "l") {
      sidebarOpen = !sidebarOpen;
      renderSidebar();
    } else if (mod && event.shiftKey && key === "1") {
      openSidebar("outline");
    } else if (mod && event.shiftKey && key === "3") {
      openSidebar("files");
    }
  };

  buildMenus();
  menuBar.addEventListener("click", onMenuClick);
  sidebar.addEventListener("click", onSidebarClick);
  statusbar.addEventListener("click", onStatusClick);
  document.addEventListener("mousedown", onDocumentMouseDown);
  window.addEventListener("keydown", onKeyDown, true);
  renderSidebar();
  renderStats();

  const statsTimer = window.setInterval(() => {
    renderStats();
    if (sidebarOpen && sidebarMode === "outline") renderSidebar();
  }, 600);

  return () => {
    window.clearInterval(statsTimer);
    menuBar.removeEventListener("click", onMenuClick);
    sidebar.removeEventListener("click", onSidebarClick);
    statusbar.removeEventListener("click", onStatusClick);
    document.removeEventListener("mousedown", onDocumentMouseDown);
    window.removeEventListener("keydown", onKeyDown, true);
  };
}
