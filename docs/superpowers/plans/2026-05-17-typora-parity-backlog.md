# Typora Parity Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. It will decide whether each batch should run in parallel or serial subagent mode and will pass only task-local context to each subagent. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement math, Mermaid diagrams, focus/typewriter modes, common shortcuts, custom themes, and local Markdown file editing in the native Typora-style editor.

**Architecture:** Extend the existing feature registry and public controller. Keep Markdown source as the canonical document data, use ProseMirror decorations and NodeViews for Typora-like previews, and add native DOM controls only in the demo route.

**Tech Stack:** TypeScript, ProseMirror, markdown-it, KaTeX, lazy-loaded Mermaid, Vite Plus, pnpm, happy-dom tests.

---

### Task 1: Package Policy And Dependencies

**Files:**
- Modify: `package.json`
- Modify: `vite.lib.config.ts`
- Delete: `package-lock.json`
- Create: `pnpm-lock.yaml`

- [x] Add `katex` and `mermaid` with `pnpm add katex mermaid`.
- [x] Change `prepublishOnly` to `pnpm build:lib`.
- [x] Add `"packageManager": "pnpm@11.1.0"`.
- [x] Externalize `katex` and `mermaid` in library build.
- [x] Remove `package-lock.json`.
- [x] Run `pnpm test` after RED tests are added to confirm failures are feature-related.

### Task 2: RED Tests For Math

**Files:**
- Create: `specs/features/math.specs.ts`
- Create: `tests/features/math.test.ts`
- Modify: `specs/features/index.ts`
- Create: `tests/math-render.test.ts`
- Modify: `tests/roundtrip.test.ts`

- [x] Add spec cases for inline math stable rendering, inline math edit-source visibility, code span exclusion, `$$` Enter commit, and multiline block math.
- [x] Add renderer tests for invalid TeX returning contained error markup.
- [x] Add round-trip tests for `$E=mc^2$` and `$$\na^2+b^2=c^2\n$$`.
- [x] Run math tests and confirm they fail because math support is missing.

### Task 3: Math Implementation

**Files:**
- Create: `src/renderers/math.ts`
- Create: `src/features/math.ts`
- Modify: `src/features/index.ts`
- Modify: `src/features/_types.ts`
- Modify: `src/decorations.ts`
- Modify: `src/styles/widgets.css`
- Modify: `specs/features/index.ts`
- Modify: `specs/pretty.ts`
- Modify: `website/main.ts`

- [x] Implement `renderMathToHtml(tex, displayMode)` using KaTeX with `throwOnError: false`, `trust: false`, and `output: "htmlAndMathml"`.
- [x] Add inline math scanner for unescaped single-dollar delimiters, ignoring `$$`, whitespace-wrapped empty content, and consumed code spans.
- [x] Add a math inline decoration widget with a unique widget key containing the TeX source.
- [x] Add a markdown-it block rule for `$$` fenced math blocks.
- [x] Add `math_block` schema, serializer handler, NodeView, active decoration, Enter commit from `$$`, and empty-block Backspace handling.
- [x] Add KaTeX CSS import and widget styles.
- [x] Run math tests until green.

### Task 4: RED Tests For Mermaid

**Files:**
- Create: `specs/features/diagram.specs.ts`
- Create: `tests/features/diagram.test.ts`
- Create: `tests/mermaid-render.test.ts`
- Modify: `specs/features/index.ts`
- Modify: `tests/roundtrip.test.ts`

- [x] Add spec case for a ` ```mermaid ` fence rendering as a diagram-aware code block.
- [x] Add round-trip test proving Mermaid fences serialize as fenced code with `mermaid` info string.
- [x] Add renderer tests with a mocked adapter for success and failure states.
- [x] Run Mermaid tests and confirm they fail because diagram support is missing.

### Task 5: Mermaid Implementation

**Files:**
- Create: `src/renderers/mermaid.ts`
- Modify: `src/features/fenced-code.ts`
- Modify: `src/styles/widgets.css`
- Modify: `specs/features/fenced-code.specs.ts` or `specs/features/diagram.specs.ts`

- [x] Implement lazy Mermaid loading and strict initialization.
- [x] Extend `CodeBlockView` with a diagram panel when `lang` is `mermaid`.
- [x] Render loading, success, and error states with `data-diagram-state`.
- [x] Preserve existing code block language input behavior.
- [x] Keep non-Mermaid code blocks unchanged.
- [x] Run diagram tests until green.

### Task 6: RED Tests For Modes

**Files:**
- Create: `tests/modes.test.ts`

- [x] Add tests for `setFocusMode`, `toggleFocusMode`, `F8`, and active/muted decorations.
- [x] Add tests for `setTypewriterMode`, `toggleTypewriterMode`, `F9`, wrapper classes, and scroll callback behavior.
- [x] Run mode tests and confirm they fail because API methods and mode plugin are missing.

### Task 7: Focus And Typewriter Modes

**Files:**
- Create: `src/modes.ts`
- Modify: `src/editor.ts`
- Modify: `src/editor-api.ts`
- Modify: `src/styles/widgets.css`

- [x] Add focus mode plugin state and decorations.
- [x] Add exported commands to set and read focus mode state.
- [x] Add controller mode methods and wrapper classes.
- [x] Add `F8` and `F9` handling in the editor wrapper.
- [x] Implement typewriter cursor-centering for rendered editor and source textarea.
- [x] Run mode tests until green.

### Task 8: RED Tests For Shortcuts

**Files:**
- Create: `tests/shortcuts.test.ts`

- [x] Add tests for `Mod-b`, `Mod-i`, `Mod-k`, `Mod-Shift-\``, `Shift-Enter`, `Mod-1`, `Mod-0`, `Mod-Shift-Q`, `Mod-Shift-M`, `Mod-Shift-K`, list shortcuts, undo, and redo.
- [x] Confirm tests fail because source-preserving shortcut commands are missing.

### Task 9: Shortcut Implementation

**Files:**
- Create: `src/shortcuts.ts`
- Modify: `src/editor.ts`

- [x] Implement source-preserving inline wrapper commands.
- [x] Implement link insertion with cursor placement.
- [x] Implement heading and paragraph block commands.
- [x] Implement quote, list, code fence, math block, and hard break commands.
- [x] Register shortcuts before feature keymaps and base keymap.
- [x] Run shortcut tests until green.

### Task 10: RED Tests For Theme Import

**Files:**
- Create: `tests/theme.test.ts`

- [x] Add tests for Typora CSS normalization of `#write`, `body`, `html`, `.md-fences`, and unsupported export directives.
- [x] Add tests for applying, importing, persisting, and clearing a custom CSS file.
- [x] Confirm tests fail because theme API is missing.

### Task 11: Theme Implementation

**Files:**
- Create: `src/theme.ts`
- Modify: `src/editor-api.ts`
- Modify: `src/lib.ts`
- Modify: `src/styles/widgets.css`

- [x] Implement CSS normalization and safe style element injection.
- [x] Add editor controller methods for theme import/apply/clear/get.
- [x] Persist current theme in localStorage when available.
- [x] Scope imported CSS to editor content and wrapper.
- [x] Run theme tests until green.

### Task 12: RED Tests For Local Files

**Files:**
- Create: `tests/local-files.test.ts`
- Modify: `src/types.d.ts`

- [x] Add tests for successful open through `showOpenFilePicker`.
- [x] Add tests for save through an existing file handle.
- [x] Add tests for Save As through `showSaveFilePicker`.
- [x] Add tests for cancellation and unsupported browser status.
- [x] Confirm tests fail because local file API is missing.

### Task 13: Local File Implementation

**Files:**
- Create: `src/local-files.ts`
- Modify: `src/editor-api.ts`
- Modify: `src/types.d.ts`

- [x] Implement File System Access API open/save/save-as helpers.
- [x] Implement file input open fallback.
- [x] Implement Blob download save-as fallback.
- [x] Return typed statuses for opened, saved, downloaded, cancelled, unsupported, and error outcomes.
- [x] Run local file tests until green.

### Task 14: Demo Website Controls

**Files:**
- Modify: `website/routes/home.ts`
- Modify: `website/style.css`

- [x] Add native toolbar controls for open, save, save as, focus, typewriter, theme import, and clear theme.
- [x] Wire controls to the editor controller.
- [x] Add concise status text with error handling.
- [x] Keep the editor as the first screen and avoid adding a landing page.
- [x] Run website build and browser smoke tests.

### Task 15: Documentation, Cleanup, Verification, Push

**Files:**
- Modify: `README.md`
- Modify: `docs/typora-syntax-survey.md`
- Modify: remote Git configuration

- [x] Update README coverage, install instructions, API methods, and theme/local file notes.
- [x] Update syntax survey for completed backlog items.
- [x] Search for redundant code, temporary files, npm references, and dead imports.
- [x] Run `pnpm test`.
- [x] Run `pnpm build`.
- [x] Start the dev server and run browser smoke checks for math, Mermaid, modes, theme import UI, and local file controls.
- [x] Update git remote to `https://github.com/Albert-PZY/typora-web.git`.
- [x] Commit all intended changes, excluding user-provided `grok.md` unless explicitly needed.
- [x] Push to the configured remote.
