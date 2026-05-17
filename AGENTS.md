# AGENTS.md

This repository is maintained through Codex-style agent work. Follow these
instructions before reading, editing, testing, committing, tagging, or releasing.

## Repository Positioning

`typora-web` is a native, lightweight, high-performance Typora-style Markdown
editor for the web. It is built around ProseMirror and a spec-driven test
harness. The goal is a close Typora editing experience while preserving
lossless Markdown round-trips.

## Mandatory Environment Rules

- Use Simplified Chinese for user-facing chat responses.
- Write repository documentation, specs, comments, and checklists in English.
- Use `pnpm` for all frontend dependency and script commands. Do not use `npm`.
- Keep generated text files UTF-8 without BOM.
- Do not introduce Vue, React, Svelte, Angular, or similar UI frameworks.
- Native TypeScript, DOM APIs, ProseMirror, and focused libraries such as KaTeX
  and Mermaid are allowed.
- On Windows, re-read a file before editing it and prefer small, focused
  patches. If a patch fails, re-read the file before choosing the next edit
  method.
- Respect `.editorconfig` and `.gitattributes` line-ending policy.

## Project Layout

The dependency direction is one-way: `src/` must not import from `tests/`,
`specs/`, or `website/`.

```text
src/         editor library, public API, features, renderers, styles
specs/       spec fixtures, event DSL, pretty DOM projection
tests/       test files and feature-case runners
website/     local demo and visual harness
docs/        contributor, release, and project documentation
```

## Core Architecture

- Markdown is an IO boundary. Runtime authority is the ProseMirror
  `EditorState`.
- Parsing and serialization must round-trip Markdown without losing supported
  syntax.
- Inline Markdown uses the Method-B model: text nodes keep source delimiter
  characters, and `normalize.ts` derives marks from those characters.
- Do not manually add or remove inline marks in feature code. Mutate text and
  let normalization rebuild marks.
- `pretty()` in `specs/pretty.ts` is a projection of the real `EditorView` DOM.
  Do not add a separate renderer for assertions.
- `defaultPlugins()` is the shared plugin stack for live editing and tests.

## Adding Markdown Behavior

1. Start with a spec or regression test that describes what the user sees.
2. Put runtime behavior in `src/features/<name>.ts` or a focused helper under
   `src/`.
3. Put spec/demo cases in `specs/features/<name>.specs.ts` when the behavior is
   interaction-driven.
4. Register runtime features in `src/features/index.ts`.
5. Register spec cases in `specs/features/index.ts`.
6. Keep parser, schema, serializer, decorations, and keymaps aligned.
7. Add edge-case coverage for syntax errors, cursor positions, and round-trip
   behavior where applicable.

## Tests And Verification

Prefer the narrowest relevant command first, then run broader verification
before completing or releasing.

```sh
pnpm test
pnpm build
pnpm build:lib
```

Useful targeted commands:

```sh
pnpm test tests/shortcuts.test.ts
pnpm test tests/mermaid-render.test.ts tests/features/diagram.test.ts
pnpm test tests/features/fenced-code.test.ts
```

For browser-facing editor behavior, run the local demo with `pnpm dev` and
verify in a real browser. Stop the dev server and remove generated temporary
browser artifacts before committing.

## Commit Rules

Every commit must follow the repository Conventional Commits policy in
`docs/git-commit-convention.md`.

- Use Conventional Commits v1.0.0 syntax.
- Split unrelated work into separate commits.
- Keep one logical behavior, documentation, release, or cleanup category per
  commit.
- Do not commit local reference files such as `grok.md` unless the project owner
  explicitly asks for that file.

## Release Rules

Follow `docs/release-process.md`.

- Unstable milestone releases use tags like `v0.4-beta.1`.
- Production releases use tags like `v1.0.0` only after the project owner
  manually decides a build is production-ready.
- Each large milestone must include a version tag and a GitHub Release with
  detailed release notes.

## Current Development Priorities

- Preserve native, framework-free architecture.
- Match Typora editing behavior where practical.
- Keep custom theme support scoped so imported Typora CSS does not leak outside
  the editor wrapper.
- Keep local file open/save behavior graceful across browsers with and without
  File System Access API support.
- Treat Mermaid, KaTeX, and other rich renderers as progressive enhancements:
  valid source renders in place, invalid source remains visible and editable.

## Cleanup Rules

- Remove temporary files and directories before committing.
- Keep `.playwright-mcp/`, ad hoc logs, build scratch files, and local-only
  notes out of commits.
- Do not revert user changes unless explicitly asked.
- Use specific `git add <path>` commands instead of broad staging when untracked
  local files are present.
