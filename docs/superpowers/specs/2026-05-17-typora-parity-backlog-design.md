# Typora Parity Backlog Design

**Date:** 2026-05-17
**Status:** Approved for autonomous execution

## Goal

Restore the next tranche of Typora-like functionality in `typora-web` while keeping the project native, lightweight, test-driven, and aligned with Markdown standards.

## Standards And Product Constraints

- CommonMark 0.31.2 remains the baseline for core Markdown block and inline parsing.
- GitHub Flavored Markdown 0.29-gfm remains the constraint for tables, task list items, strikethrough, and other supported GFM extensions.
- Typora extensions are implemented as explicit extensions: inline math, math blocks, diagram fences, focus mode, typewriter mode, theme CSS, shortcuts, and local file editing.
- KaTeX is used for TeX rendering with `throwOnError: false`, `trust: false`, and display mode derived from block vs inline context.
- Mermaid is lazy-loaded only for `mermaid` fences, initialized with `startOnLoad: false` and `securityLevel: "strict"`.
- No Vue, React, Svelte, or other UI framework is introduced.
- All production UI remains native DOM and ProseMirror.
- Package management uses pnpm only.

## Architecture

The implementation extends the existing `FeatureSpec` architecture rather than creating a parallel parser or UI framework.

- Inline math is a method-B inline feature: `$...$` source stays in the textblock, decorations hide it when inactive, and a KaTeX widget renders the preview.
- Block math is a new `math_block` node parsed by a markdown-it block rule for `$$` fences, serialized back to `$$` fences, and rendered by a NodeView with a preview plus editable source.
- Mermaid support augments the existing `code_block` NodeView. A `code_block` whose `lang` is `mermaid` gets a lazy-rendered diagram panel while preserving the fenced source.
- Focus mode is a ProseMirror decoration plugin controlled by editor API methods and `F8`.
- Typewriter mode is an editor API behavior that scrolls the active rendered or source cursor toward the vertical center and is controlled by `F9`.
- Shortcut editing is implemented as source-preserving commands. Commands insert Markdown delimiters or change block types instead of applying raw marks that cannot round-trip.
- Custom themes are managed by a small native theme module that normalizes common Typora CSS selectors, injects a scoped style tag, and persists imported CSS when storage is available.
- Local `.md` files are handled through File System Access API when available, with file-input open fallback and Blob download save-as fallback.

## Public API Changes

`createEditor()` returns a controller with additional methods:

- `toggleFocusMode()`, `setFocusMode(enabled)`, `isFocusMode()`
- `toggleTypewriterMode()`, `setTypewriterMode(enabled)`, `isTypewriterMode()`
- `openMarkdownFile()`, `saveMarkdownFile()`, `saveMarkdownFileAs()`
- `getCurrentFileName()`
- `importThemeFile(file)`, `applyThemeCss(name, cssText)`, `clearCustomTheme()`, `getCustomThemeName()`

Existing methods keep their behavior.

## Error Handling

- KaTeX errors render visible invalid-source text with an error class instead of throwing through the editor.
- Mermaid errors render an inline diagram error panel and leave the fenced source editable.
- Unsupported File System Access API calls fall back to file input or download when possible.
- User-cancelled file operations resolve with a cancelled result rather than throwing uncaught exceptions.
- Theme import rejects non-CSS files with a typed error result.

## Testing Strategy

- Add RED feature specs for inline math, block math, and Mermaid fences before implementation.
- Add parser/serializer tests for math fences and Mermaid fenced code round-trip.
- Add shortcut unit tests for delimiter insertion, heading conversion, link insertion, math block creation, hard breaks, and list/quote shortcuts.
- Add editor API tests for focus/typewriter state, theme normalization/import, local file open/save success, unsupported fallback, and cancellation.
- Run the full test suite, typecheck/build, and browser smoke checks before claiming completion.

## Execution Checklist

- [ ] Establish pnpm as the active package manager and remove npm-only workflow references.
- [ ] Add KaTeX and Mermaid dependencies with lazy Mermaid loading.
- [ ] Add math specs and tests covering inline math, block math input, parser, serializer, and error rendering.
- [ ] Implement inline math scanning, KaTeX widgets, source visibility, and serializer preservation.
- [ ] Implement block math parsing, schema, NodeView, input commit, key behavior, serializer, and styles.
- [ ] Add Mermaid specs and tests covering `mermaid` fences, source preservation, lazy render state, and error panels.
- [ ] Implement Mermaid diagram panels inside fenced code NodeView without changing non-Mermaid code blocks.
- [ ] Add focus mode tests and implement decoration-based focus mode with `F8`.
- [ ] Add typewriter mode tests and implement rendered/source cursor centering with `F9`.
- [ ] Add shortcut tests and implement source-preserving common editing shortcuts.
- [ ] Add theme tests and implement scoped Typora CSS import, style injection, persistence, and clearing.
- [ ] Add local file tests and implement open/save/save-as with File System Access API and fallbacks.
- [ ] Update the demo website with compact native controls for local files, modes, and theme import.
- [ ] Update README coverage and API documentation.
- [ ] Remove redundant npm lock/workflow references and temporary artifacts.
- [ ] Run full verification: tests, typecheck/build, browser smoke, git diff review, remote setup, commit, and push.

## Sources

- CommonMark Spec 0.31.2: https://spec.commonmark.org/0.31.2/
- GitHub Flavored Markdown Spec 0.29-gfm: https://github.github.com/gfm/
- Typora Markdown Reference: https://support.typora.io/Markdown-Reference/
- Typora Diagrams: https://support.typora.io/Draw-Diagrams-With-Markdown/
- Typora Themes: https://support.typora.io/About-Themes/
- Typora Shortcut Keys: https://support.typora.io/Shortcut-Keys/
- KaTeX Auto-render and Options: https://katex.org/docs/autorender and https://katex.org/docs/options
- Mermaid Usage: https://mermaid.js.org/config/usage.html
- MDN File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker
