# Acceptance Criteria: Typora Parity Backlog

**Spec:** `docs/superpowers/specs/2026-05-17-typora-parity-backlog-design.md`
**Date:** 2026-05-17
**Status:** Approved

---

## Criteria

| ID | Description | Test Type | Preconditions | Expected Result |
|----|-------------|-----------|---------------|-----------------|
| AC-001 | Inline math source `$E=mc^2$` renders as a KaTeX inline widget while preserving the original Markdown source. | Logic | Run feature specs and round-trip tests with inline math input. | Pretty output contains an inline math marker and `serialize(parse("$E=mc^2$"))` returns `$E=mc^2$\n`. |
| AC-002 | Inline math does not parse inside inline code spans. | Logic | Run inline math specs with `` `$x$` `` input. | Pretty output renders code, not math. |
| AC-003 | Block math source fenced by `$$` parses into an editable math block and serializes back to `$$` fences. | Logic | Run parser and serializer tests with multiline math. | The parsed doc contains `math_block`, pretty output contains a block math marker, and serialization preserves the fence shape. |
| AC-004 | Typing `$$` followed by Enter commits a math block and places the cursor inside it. | UI interaction | Run the feature spec event sequence through the existing simulator. | Checkpoint after Enter shows an empty math block with the cursor in the editable source. |
| AC-005 | Invalid TeX is contained in the editor UI instead of throwing uncaught exceptions. | Logic | Render invalid inline and block TeX through the renderer helpers. | The renderer returns error markup or error state and test execution does not throw. |
| AC-006 | A fenced code block with language `mermaid` gets diagram rendering chrome while preserving fenced Markdown source. | Logic | Parse and pretty-render a `mermaid` fence. | Pretty output identifies a Mermaid diagram block and serialization returns a ` ```mermaid ` fence. |
| AC-007 | Mermaid rendering is lazy and configured with strict security. | Logic | Inspect renderer helper behavior and run tests with a mocked Mermaid module. | Mermaid import/render is invoked only for `mermaid` fences and initialization includes `startOnLoad: false` and `securityLevel: "strict"`. |
| AC-008 | Mermaid syntax errors render an error panel and keep the source editable. | Logic | Run Mermaid renderer test with invalid graph source. | Result state is `error` with a non-empty message and no uncaught exception. |
| AC-009 | Focus mode can be toggled through API and `F8`, dimming non-active blocks. | UI interaction | Create an editor with multiple blocks and move the selection. | Wrapper mode class and ProseMirror decoration classes reflect active and muted blocks. |
| AC-010 | Typewriter mode can be toggled through API and `F9`, and it requests cursor centering in rendered and source modes. | UI interaction | Stub scrolling APIs in a happy-dom editor test. | Enabling typewriter mode adds the wrapper class and selection changes call the scroll helper without throwing. |
| AC-011 | Common editing shortcuts preserve Markdown source delimiters. | Logic | Run shortcut unit tests for selected and empty cursor states. | `Mod-b`, `Mod-i`, `Mod-k`, `Shift-Enter`, heading shortcuts, quote/list shortcuts, code fence, and math block commands produce serializable Markdown. |
| AC-012 | Imported Typora theme CSS is scoped to the editor and common selectors such as `#write` are normalized. | Logic | Run theme normalization tests with sample Typora CSS. | Output CSS targets `.ProseMirror`/`.typora-web-wrap` and removes unsupported Typora-only export directives. |
| AC-013 | A CSS theme file can be imported, applied, persisted, and cleared through the editor API. | UI interaction | Create an editor and pass a CSS `File` object. | A style element is injected, current theme name is reported, storage is updated when available, and clearing removes the style. |
| AC-014 | Local `.md` open reads file contents into the editor and records the current file name. | UI interaction | Stub `showOpenFilePicker` with a markdown file handle. | Editor Markdown equals file text and current file name equals the opened file name. |
| AC-015 | Local save writes current Markdown to the existing file handle. | UI interaction | Open a stub file handle, edit Markdown, and call save. | The handle writable receives the exact serialized Markdown and closes. |
| AC-016 | Save As and unsupported open fallbacks do not throw and return deterministic status. | UI interaction | Run editor API tests with unsupported File System Access API. | Fallback open uses file input path when supplied and unsupported save returns a typed unsupported or downloaded result. |
| AC-017 | The demo website exposes native controls for open, save, save as, focus mode, typewriter mode, and theme import without introducing a framework. | UI interaction | Build and inspect website route code. | `website/routes/home.ts` uses native DOM elements and `createEditor()` API only. |
| AC-018 | Package scripts and lockfiles follow pnpm-only project policy. | API | Inspect repository files. | `pnpm-lock.yaml` exists, `package-lock.json` is removed, and scripts do not call `npm run`. |
| AC-019 | Full verification passes before push. | API | Run fresh verification commands. | `pnpm test`, `pnpm build`, and browser smoke checks exit successfully. |
