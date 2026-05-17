// Public façade. Consumers see only `createEditor()` and the small
// `Editor` controller it returns; ProseMirror is an implementation
// detail.
//
// Two surfaces are intentionally exposed:
//   - the high-level controller (getMarkdown / setMarkdown /
//     toggleSource / focus / destroy) is the supported API.
//   - `editor.view` is an escape hatch onto the underlying PM
//     EditorView for advanced cases (custom plugins, deep PM hooks).
//     Documented as "no warranty" — touching it is opt-in.
//
// Source-mode toggle (rendered ↔ raw markdown textarea) is built in.
// `⌘/` (Mac) or `Ctrl+/` (other) is wired automatically; consumers
// can also call `editor.toggleSource()` directly.

import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import { defaultPlugins } from "./editor.ts";
import {
  pickMarkdownFile,
  saveMarkdownFileAs as saveMarkdownAs,
  writeMarkdownFile,
  type FileResult,
} from "./local-files.ts";
import { isFocusMode as readFocusMode, setFocusMode as dispatchFocusMode } from "./modes.ts";
import { parse } from "./parser.ts";
import { schema } from "./schema.ts";
import { serialize } from "./serializer.ts";
import {
  applyThemeCss,
  clearPersistedTheme,
  clearTheme,
  loadPersistedTheme,
  persistTheme,
} from "./theme.ts";

export interface EditorOptions {
  /** Initial markdown the editor opens with. Defaults to empty. */
  initialContent?: string;
  /** Fired on every document transaction; arg is the current markdown. Raw, no debounce. */
  onChange?: (md: string) => void;
  /** Fired when the editor surface (rendered or source) gains focus. */
  onFocus?: () => void;
  /** Fired when the editor surface loses focus. */
  onBlur?: () => void;
}

export interface Editor {
  /** Current markdown — renders source from the live PM doc, or returns the textarea contents in source mode. */
  getMarkdown(): string;
  /** Replace the document. Works in either rendered or source mode. */
  setMarkdown(md: string): void;
  /** Flip between rendered and raw-source views. ⌘/ does the same. */
  toggleSource(): void;
  /** Whether the editor is currently in raw-source mode. */
  isSourceMode(): boolean;
  toggleFocusMode(): void;
  setFocusMode(enabled: boolean): void;
  isFocusMode(): boolean;
  toggleTypewriterMode(): void;
  setTypewriterMode(enabled: boolean): void;
  isTypewriterMode(): boolean;
  openMarkdownFile(): Promise<FileResult>;
  saveMarkdownFile(): Promise<FileResult>;
  saveMarkdownFileAs(): Promise<FileResult>;
  getCurrentFileName(): string | null;
  importThemeFile(file: File): Promise<{ status: "applied"; name: string } | { status: "error"; message: string }>;
  applyThemeCss(name: string, cssText: string): void;
  clearCustomTheme(): void;
  getCustomThemeName(): string | null;
  /** Focus whichever surface is active. */
  focus(): void;
  /** Tear down the editor and remove its DOM. */
  destroy(): void;
  /** Escape hatch: the live ProseMirror view. Advanced; no API stability promised on this access. */
  readonly view: EditorView;
}

export function createEditor(
  host: HTMLElement,
  options: EditorOptions = {},
): Editor {
  const wrap = document.createElement("div");
  wrap.className = "typora-web-wrap";
  const editorHost = document.createElement("div");
  editorHost.className = "typora-web-editor-host";
  const sourceTextarea = document.createElement("textarea");
  sourceTextarea.className = "typora-web-source";
  sourceTextarea.hidden = true;
  wrap.append(editorHost, sourceTextarea);
  host.append(wrap);

  let view: EditorView;
  let inSource = false;
  let typewriterMode = false;
  let currentFileHandle: FileSystemFileHandle | null = null;
  let currentFileName: string | null = null;
  let customThemeName: string | null = null;

  function buildView(initialMd: string): EditorView {
    const doc = initialMd ? parse(initialMd) : schema.nodes.doc.createAndFill()!;
    const base = EditorState.create({
      schema,
      doc,
      plugins: defaultPlugins({ cursorWidget: false }),
    });
    // Fire one no-op transaction so normalize's appendTransaction runs
    // and method-B marks (em, strong, autolink, etc.) apply on first
    // render. EditorState.create alone runs `state.init` but not
    // `appendTransaction`, leaving parsed-from-seed docs with raw text.
    const state = base.apply(base.tr.setSelection(TextSelection.atStart(doc)));
    const v: EditorView = new EditorView(editorHost, {
      state,
      dispatchTransaction(tr) {
        const next = v.state.apply(tr);
        v.updateState(next);
        if (typewriterMode) scrollRenderedCursorToCenter();
        options.onChange?.(serialize(next.doc));
      },
      handleDOMEvents: {
        focus: () => { options.onFocus?.(); return false; },
        blur: () => { options.onBlur?.(); return false; },
      },
    });
    return v;
  }

  function rebuild(md: string): void {
    view.destroy();
    editorHost.innerHTML = "";
    view = buildView(md);
  }

  function syncModeClasses(): void {
    wrap.classList.toggle("tw-focus-mode", readFocusMode(view.state));
    wrap.classList.toggle("tw-typewriter-mode", typewriterMode);
  }

  function scrollRenderedCursorToCenter(): void {
    try {
      const coords = view.coordsAtPos(view.state.selection.head);
      const pageY = coords.top + window.scrollY;
      const target = Math.max(0, pageY - window.innerHeight / 2);
      window.scrollTo({ top: target, behavior: "smooth" });
    } catch {}
  }

  // Resize the source textarea to its content height. Called on every
  // input + on entering source mode so the page never shows a nested
  // scrollbar inside the textarea.
  function autoSizeSource(): void {
    sourceTextarea.style.height = "auto";
    sourceTextarea.style.height = `${sourceTextarea.scrollHeight}px`;
  }

  // Find the Y pixel position (in viewport coords) of `offset` inside
  // the textarea. Uses a hidden mirror div with matching font / width /
  // padding / wrap so soft-wrapped lines map correctly.
  function caretYInTextarea(offset: number): number | null {
    const ta = sourceTextarea;
    if (!ta.isConnected) return null;
    const cs = window.getComputedStyle(ta);
    const mirror = document.createElement("div");
    const props = [
      "fontFamily", "fontSize", "fontWeight", "fontStyle",
      "letterSpacing", "lineHeight", "tabSize",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      "boxSizing", "whiteSpace", "wordBreak", "wordWrap", "width",
    ] as const;
    for (const p of props) {
      (mirror.style as unknown as Record<string, string>)[p] = cs[p];
    }
    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.top = "0";
    mirror.style.left = "0";
    mirror.style.height = "auto";
    const value = ta.value;
    mirror.textContent = value.slice(0, offset);
    const marker = document.createElement("span");
    marker.textContent = "​"; // zero-width space
    mirror.appendChild(marker);
    mirror.appendChild(document.createTextNode(value.slice(offset) || " "));
    document.body.appendChild(mirror);
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const taRect = ta.getBoundingClientRect();
    document.body.removeChild(mirror);
    return taRect.top + (markerRect.top - mirrorRect.top);
  }

  function scrollTextareaCursorIntoView(): void {
    const offset = sourceTextarea.selectionStart;
    if (offset == null) return;
    const y = caretYInTextarea(offset);
    if (y == null) return;
    const pageY = y + window.scrollY;
    const divisor = typewriterMode ? 2 : 3;
    const target = pageY - window.innerHeight / divisor;
    window.scrollTo({
      top: target,
      behavior: (typewriterMode ? "smooth" : "instant") as ScrollBehavior,
    });
  }

  // Best-effort cursor mapping between rendered and source. Both
  // directions cut/parse a prefix and use its length / content.size as
  // the position. Mid-syntax cursors (e.g. between `*` and `bold` in
  // an unclosed `*bold`) may land a few chars off, but plain prose and
  // line boundaries are spot-on.
  function renderedCursorToMdOffset(): number {
    const sel = view.state.selection;
    try {
      return serialize(view.state.doc.cut(0, sel.from)).length;
    } catch {
      return serialize(view.state.doc).length;
    }
  }
  function mdOffsetToRenderedPos(md: string, offset: number): number {
    try {
      return parse(md.slice(0, Math.max(0, offset))).content.size;
    } catch {
      return 0;
    }
  }

  function enterSource(): void {
    const md = serialize(view.state.doc);
    const mdCursor = renderedCursorToMdOffset();
    sourceTextarea.value = md;
    editorHost.hidden = true;
    sourceTextarea.hidden = false;
    autoSizeSource();
    sourceTextarea.focus();
    const clamped = Math.min(mdCursor, md.length);
    sourceTextarea.setSelectionRange(clamped, clamped);
    scrollTextareaCursorIntoView();
    inSource = true;
  }

  function exitSource(): void {
    const md = sourceTextarea.value;
    const mdCursor = sourceTextarea.selectionStart ?? md.length;
    const targetRaw = mdOffsetToRenderedPos(md, mdCursor);
    rebuild(md);
    const target = Math.min(targetRaw, view.state.doc.content.size);
    try {
      const sel = TextSelection.near(view.state.doc.resolve(target));
      // scrollIntoView() flag asks PM to nudge the cursor into the
      // visible band post-dispatch — without it the page stays
      // wherever the textarea left it.
      view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    } catch {}
    sourceTextarea.hidden = true;
    editorHost.hidden = false;
    view.focus();
    inSource = false;
  }

  // ⌘/ on Mac, Ctrl+/ elsewhere. Window-level keydown so it works
  // whether the editor or the source textarea has focus; gated on
  // event-target containment so multiple editors don't poach each
  // other's keystrokes.
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "F8") {
      const t = e.target as Element | null;
      if (t && (editorHost.contains(t) || t === sourceTextarea)) {
        e.preventDefault();
        controller.toggleFocusMode();
      }
      return;
    }
    if (e.key === "F9") {
      const t = e.target as Element | null;
      if (t && (editorHost.contains(t) || t === sourceTextarea)) {
        e.preventDefault();
        controller.toggleTypewriterMode();
      }
      return;
    }
    if (e.key !== "/") return;
    const isMac = /Mac/.test(navigator.platform);
    if (!(isMac ? e.metaKey : e.ctrlKey)) return;
    if (e.shiftKey || e.altKey) return;
    const t = e.target as Element | null;
    if (!t) return;
    if (!editorHost.contains(t) && t !== sourceTextarea) return;
    e.preventDefault();
    if (inSource) exitSource();
    else enterSource();
  };
  window.addEventListener("keydown", onKey);

  // Wire textarea focus/blur to the same callbacks as the editor.
  if (options.onFocus) {
    sourceTextarea.addEventListener("focus", () => options.onFocus!());
  }
  if (options.onBlur) {
    sourceTextarea.addEventListener("blur", () => options.onBlur!());
  }
  // Auto-grow the textarea as the user types so the page itself
  // owns the scroll, never the textarea.
  sourceTextarea.addEventListener("input", autoSizeSource);

  view = buildView(options.initialContent ?? "");
  const persistedTheme = loadPersistedTheme();
  if (persistedTheme) {
    applyThemeCss(wrap, persistedTheme.name, persistedTheme.cssText);
    customThemeName = persistedTheme.name;
  }

  const controller: Editor = {
    getMarkdown(): string {
      return inSource ? sourceTextarea.value : serialize(view.state.doc);
    },
    setMarkdown(md: string): void {
      if (inSource) {
        sourceTextarea.value = md;
      } else {
        rebuild(md);
      }
    },
    toggleSource(): void {
      if (inSource) exitSource();
      else enterSource();
    },
    isSourceMode(): boolean {
      return inSource;
    },
    toggleFocusMode(): void {
      this.setFocusMode(!this.isFocusMode());
    },
    setFocusMode(enabled: boolean): void {
      dispatchFocusMode(view.state, (tr) => view.dispatch(tr), enabled);
      syncModeClasses();
    },
    isFocusMode(): boolean {
      return readFocusMode(view.state);
    },
    toggleTypewriterMode(): void {
      this.setTypewriterMode(!typewriterMode);
    },
    setTypewriterMode(enabled: boolean): void {
      typewriterMode = enabled;
      syncModeClasses();
      if (enabled) {
        if (inSource) scrollTextareaCursorIntoView();
        else scrollRenderedCursorToCenter();
      }
    },
    isTypewriterMode(): boolean {
      return typewriterMode;
    },
    async openMarkdownFile(): Promise<FileResult> {
      const picked = await pickMarkdownFile();
      if (picked.status !== "picked") return picked;
      const text = await picked.file.text();
      currentFileHandle = picked.handle;
      currentFileName = picked.handle?.name || picked.file.name;
      this.setMarkdown(text);
      return { status: "opened", name: currentFileName };
    },
    async saveMarkdownFile(): Promise<FileResult> {
      if (!currentFileHandle) return this.saveMarkdownFileAs();
      return writeMarkdownFile(currentFileHandle, this.getMarkdown());
    },
    async saveMarkdownFileAs(): Promise<FileResult> {
      const result = await saveMarkdownAs(this.getMarkdown());
      if (result.status === "saved" || result.status === "downloaded") {
        currentFileName = result.name;
      }
      return result;
    },
    getCurrentFileName(): string | null {
      return currentFileName;
    },
    async importThemeFile(file: File) {
      if (!file.name.toLowerCase().endsWith(".css")) {
        return { status: "error", message: "Theme file must be a .css file." };
      }
      const cssText = await file.text();
      this.applyThemeCss(file.name, cssText);
      persistTheme(file.name, cssText);
      return { status: "applied", name: file.name };
    },
    applyThemeCss(name: string, cssText: string): void {
      applyThemeCss(wrap, name, cssText);
      customThemeName = name;
    },
    clearCustomTheme(): void {
      clearTheme(wrap);
      clearPersistedTheme();
      customThemeName = null;
    },
    getCustomThemeName(): string | null {
      return customThemeName;
    },
    focus(): void {
      if (inSource) sourceTextarea.focus();
      else view.focus();
    },
    destroy(): void {
      window.removeEventListener("keydown", onKey);
      view.destroy();
      wrap.remove();
    },
    get view() {
      return view;
    },
  };
  syncModeClasses();
  return controller;
}
