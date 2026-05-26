import type { Editor } from "../src/lib.ts";
import { setBlockType } from "prosemirror-commands";
import type { Command } from "prosemirror-state";
import { pickMarkdownDirectory, type MarkdownTreeEntry } from "../src/local-files.ts";
import { schema } from "../src/schema.ts";
import { getEditorStats } from "./editor-stats.ts";
import { onLocaleChange, t, translateTree } from "./i18n.ts";

type ShellOptions = {
  root: HTMLElement;
  main: HTMLElement;
  editor: Editor;
  host: HTMLElement;
  setStatus(key: string, vars?: Record<string, string | number | undefined>): void;
};

type SidebarMode = "files" | "outline";

type OutlineItem = {
  id: string;
  level: number;
  text: string;
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
  name: "Typora-Web",
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

const markdownResultKey = (
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

const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function outlineId(index: number): string {
  return `outline-${index}`;
}

function applyEditorCommand(editor: Editor, command: Command): boolean {
  const handled = command(editor.view.state, (tr) => editor.view.dispatch(tr), editor.view);
  if (handled) editor.focus();
  return handled;
}

export function mountEditorShell(options: ShellOptions): () => void {
  const { root, main, editor, host, setStatus } = options;
  let sidebarMode: SidebarMode = "files";
  let sidebarOpen = false;
  let statusbarOpen = true;
  let currentTree = DEFAULT_TREE;
  let activeFilePath = "";
  let outlineSnapshot = "";
  let outlineDocRef: unknown = null;
  let activeOutlineId = "";
  let statsOpen = false;
  let statsDocRef: unknown = null;
  let statsMarkdown = "";

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
    statusbar.hidden = !statusbarOpen;
  }

  function buildMenus(): void {
    menuBar.innerHTML = MENU_GROUPS.map((group) => `
      <div class="editor-menu-group">
        <button type="button" class="editor-menu-button" data-menu="${group.key}" data-i18n="${group.label}"></button>
        <div class="editor-menu-dropdown" role="menu" hidden>
          ${group.items.map(([action, label, shortcut]) => `
            <button type="button" role="menuitem" data-menu-action="${action}">
              <span class="editor-menu-check" aria-hidden="true"></span>
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
      const active = entry.path === activeFilePath ? " active" : "";
      return `<li><button type="button" class="tree-file${active}" data-file-path="${escapeHtml(entry.path)}"><span class="tree-icon" aria-hidden="true"></span>${escapeHtml(entry.name)}</button></li>`;
    }
    return `<li><div class="tree-dir"><span class="tree-icon" aria-hidden="true"></span>${escapeHtml(entry.name)}</div><ul>${(entry.children ?? []).map(renderTreeEntry).join("")}</ul></li>`;
  }

  function headingItems(): OutlineItem[] {
    const items: OutlineItem[] = [];
    editor.view.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        items.push({
          id: outlineId(items.length),
          level: Number(node.attrs.level ?? 1),
          text: node.textContent,
        });
      }
    });
    return items;
  }

  function currentOutlineSnapshot(): string {
    return headingItems().map((item) => `${item.level}:${item.text}`).join("\n");
  }

  function renderSidebar(): void {
    main.classList.toggle("sidebar-open", sidebarOpen);
    sidebar.setAttribute("aria-hidden", sidebarOpen ? "false" : "true");
    if (!sidebarOpen) {
      sidebarTabs.replaceChildren();
      sidebarBody.replaceChildren();
      renderMenuChecks();
      return;
    }
    sidebarTabs.innerHTML = `
      <button type="button" data-sidebar-mode="files" class="${sidebarMode === "files" ? "active" : ""}" data-i18n="home.sidebar.files"></button>
      <button type="button" data-sidebar-mode="outline" class="${sidebarMode === "outline" ? "active" : ""}" data-i18n="home.sidebar.outline"></button>
    `;
    if (sidebarMode === "files") {
      sidebarBody.innerHTML = `<ul class="editor-file-tree">${renderTreeEntry(currentTree)}</ul>`;
    } else {
      const headings = headingItems();
      outlineDocRef = editor.view.state.doc;
      outlineSnapshot = headings.map((item) => `${item.level}:${item.text}`).join("\n");
      sidebarBody.innerHTML = headings.length
        ? `<ol class="editor-outline">${headings.map((h, index) => `
          <li>
            <button type="button" class="outline-item outline-level-${h.level}" data-outline-id="${h.id}" data-outline-index="${index}">
              <span class="outline-bullet" aria-hidden="true"></span>
              <span class="outline-text">${escapeHtml(h.text || "(empty heading)")}</span>
              <span class="outline-level-label">H${h.level}</span>
            </button>
          </li>
        `).join("")}</ol>`
        : `<p class="editor-sidebar-empty" data-i18n="home.sidebar.emptyOutline"></p>`;
    }
    translateTree(sidebar);
    updateActiveOutline();
    renderMenuChecks();
  }

  function renderStats(force = false): void {
    statsPanel.hidden = !statsOpen;
    statusbar.hidden = !statusbarOpen;

    const sourceMode = editor.isSourceMode();
    const docRef = sourceMode ? null : editor.view.state.doc;
    if (!force && !sourceMode && docRef === statsDocRef) return;

    const markdown = editor.getMarkdown();
    if (!force && sourceMode && markdown === statsMarkdown) return;

    const stats = getEditorStats(markdown);
    statsDocRef = docRef;
    statsMarkdown = markdown;
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
  }

  function editorHeadingElements(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>(
      ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6",
    ));
  }

  function setActiveOutline(id: string, options: { reveal?: boolean } = {}): void {
    const changed = id !== activeOutlineId;
    activeOutlineId = id;
    const reveal = options.reveal ?? changed;
    for (const item of sidebarBody.querySelectorAll<HTMLButtonElement>(".outline-item")) {
      const active = item.dataset.outlineId === id;
      item.classList.toggle("active", active);
      if (active && reveal) item.scrollIntoView?.({ block: "nearest" });
    }
  }

  function updateActiveOutline(): void {
    if (!sidebarOpen || sidebarMode !== "outline") return;
    const headings = editorHeadingElements();
    if (headings.length === 0) {
      setActiveOutline("", { reveal: false });
      return;
    }

    const viewportAnchor = 96;
    let activeIndex = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i]!.getBoundingClientRect().top <= viewportAnchor) activeIndex = i;
      else break;
    }

    const nextActiveId = outlineId(activeIndex);
    setActiveOutline(nextActiveId);
  }

  function jumpToOutline(index: number): void {
    const heading = editorHeadingElements()[index];
    if (!heading) return;
    heading.scrollIntoView({ block: "start", behavior: "smooth" });
    setActiveOutline(outlineId(index), { reveal: true });
  }

  function openSidebar(mode: SidebarMode): void {
    sidebarMode = mode;
    sidebarOpen = true;
    renderSidebar();
  }

  async function openFolder(): Promise<void> {
    openSidebar("files");
    const result = await pickMarkdownDirectory();
    if (result.status === "picked") {
      currentTree = result.tree;
      activeFilePath = "";
      setStatus("home.status.folderOpened", { name: result.tree.name });
      renderSidebar();
    } else if (result.status === "unsupported") {
      setStatus("home.status.folderUnsupported");
    } else if (result.status === "cancelled") {
      setStatus("home.status.cancelled");
    } else if (result.status === "error") {
      setStatus("home.status.error", { message: result.message });
    }
  }

  async function openTreeFile(path: string): Promise<void> {
    const file = findTreeFile(currentTree, path);
    if (!file?.handle) {
      setStatus("home.status.notImplemented");
      return;
    }
    const result = await editor.openMarkdownFileHandle(file.handle);
    const message = markdownResultKey(result);
    setStatus(message.key, message.vars);
    if (result.status === "opened") activeFilePath = path;
    renderStats();
    if (result.status === "opened" || sidebarMode === "outline") renderSidebar();
  }

  function runMenuAction(action: string): void {
    setMenuOpen(null);
    if (action === "new") void editor.createMarkdownFile().then((result) => {
      const message = markdownResultKey(result);
      setStatus(message.key, message.vars);
      if (result.status === "saved") activeFilePath = "";
      renderStats();
      if (sidebarOpen) renderSidebar();
    });
    else if (action === "open") void editor.openMarkdownFile().then((result) => {
      const message = markdownResultKey(result);
      setStatus(message.key, message.vars);
      if (result.status === "opened") activeFilePath = "";
      renderStats();
      if (sidebarOpen) renderSidebar();
    });
    else if (action === "open-folder") void openFolder();
    else if (action === "new-window") window.open(window.location.href, "_blank", "noopener");
    else if (action === "save") void editor.saveMarkdownFile().then((result) => {
      const message = markdownResultKey(result);
      setStatus(message.key, message.vars);
      renderStats();
    });
    else if (action === "save-as") void editor.saveMarkdownFileAs().then((result) => {
      const message = markdownResultKey(result);
      setStatus(message.key, message.vars);
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
    else if (action === "print") window.print();
    else if (action === "fullscreen") void toggleFullscreen();
    else if (action === "paragraph") {
      if (!applyEditorCommand(editor, setBlockType(schema.nodes.paragraph))) {
        setStatus("home.status.notImplemented");
      }
    }
    else if (/^heading-[1-3]$/.test(action)) {
      const level = Number(action.at(-1));
      if (!applyEditorCommand(editor, setBlockType(schema.nodes.heading, { level, style: "atx" }))) {
        setStatus("home.status.notImplemented");
      }
    }
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
      return;
    }
    const fileButton = target.closest<HTMLButtonElement>("[data-file-path]");
    if (fileButton?.dataset.filePath) void openTreeFile(fileButton.dataset.filePath);
    const outlineButton = target.closest<HTMLButtonElement>("[data-outline-index]");
    if (outlineButton?.dataset.outlineIndex) {
      jumpToOutline(Number(outlineButton.dataset.outlineIndex));
      return;
    }
  };

  const onStatusClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const action = target.closest<HTMLButtonElement>("[data-shell-action]")?.dataset.shellAction;
    setMenuOpen(null);
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
    if (event.defaultPrevented) {
      renderMenuChecks();
      renderStats();
      if (sidebarOpen && sidebarMode === "outline") renderSidebar();
      return;
    }
    if (!host.contains(event.target as Node | null) && event.target !== document.body) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod && event.key !== "F8" && event.key !== "F9") return;
    const key = event.key.toLowerCase();
    const logicalKey = key === "!" ? "1" : key === "#" ? "3" : key;
    const guarded = (
      (mod && ["/", "s", "o"].includes(logicalKey)) ||
      (mod && event.shiftKey && ["l", "1", "3"].includes(logicalKey)) ||
      event.key === "F8" ||
      event.key === "F9"
    );
    if (!guarded) return;
    event.preventDefault();
    if (mod && event.shiftKey && logicalKey === "l") {
      sidebarOpen = !sidebarOpen;
      renderSidebar();
    } else if (mod && event.shiftKey && logicalKey === "1") {
      openSidebar("outline");
    } else if (mod && event.shiftKey && logicalKey === "3") {
      openSidebar("files");
    } else if (mod && logicalKey === "o") {
      runMenuAction("open");
    } else if (mod && logicalKey === "s") {
      runMenuAction(event.shiftKey ? "save-as" : "save");
    } else if (mod && logicalKey === "/") {
      runMenuAction("source");
    } else if (event.key === "F8") {
      runMenuAction("focus");
    } else if (event.key === "F9") {
      runMenuAction("typewriter");
    }
  };

  buildMenus();
  menuBar.addEventListener("click", onMenuClick);
  sidebar.addEventListener("click", onSidebarClick);
  statusbar.addEventListener("click", onStatusClick);
  document.addEventListener("mousedown", onDocumentMouseDown);
  window.addEventListener("scroll", updateActiveOutline, { passive: true });
  window.addEventListener("resize", updateActiveOutline);
  window.addEventListener("keydown", onKeyDown, true);
  const cleanupLocale = onLocaleChange(() => {
    translateTree(menuBar);
    renderSidebar();
    renderStats(true);
  });
  renderSidebar();
  renderStats();

  const statsTimer = window.setInterval(() => {
    renderStats();
    if (sidebarOpen && sidebarMode === "outline") {
      const nextOutlineDocRef = editor.view.state.doc;
      if (nextOutlineDocRef !== outlineDocRef) {
        outlineDocRef = nextOutlineDocRef;
        const nextOutlineSnapshot = currentOutlineSnapshot();
        if (nextOutlineSnapshot !== outlineSnapshot) renderSidebar();
      }
      updateActiveOutline();
    }
  }, 600);

  return () => {
    window.clearInterval(statsTimer);
    cleanupLocale();
    menuBar.removeEventListener("click", onMenuClick);
    sidebar.removeEventListener("click", onSidebarClick);
    statusbar.removeEventListener("click", onStatusClick);
    document.removeEventListener("mousedown", onDocumentMouseDown);
    window.removeEventListener("scroll", updateActiveOutline);
    window.removeEventListener("resize", updateActiveOutline);
    window.removeEventListener("keydown", onKeyDown, true);
  };
}

function findTreeFile(entry: MarkdownTreeEntry, path: string): MarkdownTreeEntry | null {
  if (entry.path === path && entry.kind === "file") return entry;
  for (const child of entry.children ?? []) {
    const found = findTreeFile(child, path);
    if (found) return found;
  }
  return null;
}

async function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
}
