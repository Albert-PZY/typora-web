# Contributing

## 中文贡献指南

感谢你帮助改进 typora-web。这个项目的目标是在 Web 端尽量复刻 Typora 的 Markdown 编辑体验，同时保持原生、轻量、高性能和可测试。

基本原则：

- 使用 TypeScript、DOM API、ProseMirror、markdown-it、CodeMirror 6、KaTeX、Mermaid 等轻量库，不引入 Vue、React、Svelte、Angular 等前端框架。
- Markdown 基线严格遵守 CommonMark 0.31.2；Typora 风格行为必须作为明确扩展实现，并配套测试。
- 优先保留 Markdown 源码结构。任何渲染预览都不能破坏序列化所需的源文本。
- 前端命令统一使用 `pnpm`，不要使用 `npm`。
- 变更行为前先补测试或规格，优先运行窄范围测试，再运行完整验证。
- 提交必须遵守 `docs/git-commit-convention.md`，不同类型的修改要拆分成多次提交。
- 阶段性大改动发布前必须按 `docs/release-process.md` 准备版本号和 release notes。

常用命令：

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm build:lib
```

在 Windows 上编辑文件时，先重新读取当前文件内容，优先使用小而集中的补丁，并确保生成文件是 UTF-8 无 BOM。

## English Guide

Thanks for helping improve typora-web. This project aims to reproduce the
Typora editing experience in a native, lightweight web editor while keeping the
Markdown source model explicit and testable.

## Project Principles

- Keep the editor native: TypeScript, DOM APIs, and ProseMirror are allowed;
  Vue, React, Svelte, and similar frameworks are not.
- Keep behavior spec-driven. A feature is not complete until it has executable
  coverage.
- Follow CommonMark 0.31.2 for Markdown baseline behavior. Typora extensions
  must be explicit compatibility features.
- Preserve Markdown source form wherever possible. Rendered affordances should
  not destroy the source text the serializer needs.
- Use pnpm for frontend package management. Do not use npm.
- Keep generated files UTF-8 without BOM.

## Development Setup

```sh
pnpm install
pnpm dev
```

Useful scripts:

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the demo website |
| `pnpm test` | Run the full test suite |
| `pnpm build` | Type-check and build the website |
| `pnpm build:lib` | Type-check and build the library bundle |
| `pnpm preview` | Preview the production website build |

## Before You Change Code

1. Read the relevant existing module before editing it.
2. Check the feature registry in `src/features/index.ts`.
3. Look for an existing spec in `specs/features/`.
4. Add or update tests first when behavior changes.
5. Keep changes scoped to the requested behavior.

On Windows, re-read a file before applying patches to it. Prefer small focused
patches, and verify generated files do not include a UTF-8 BOM.

## Feature Workflow

Most editor behavior belongs in a feature module under `src/features/`.

Typical feature work touches:

| Path | When to update |
|---|---|
| `src/features/<feature>.ts` | Schema, parser, serializer, keymap, plugin, or NodeView behavior |
| `specs/features/<feature>.specs.ts` | User-observable editing behavior |
| `tests/features/<feature>.test.ts` | Spec replay entrypoint |
| `tests/*.test.ts` | Focused unit tests for pure helpers, public API, or browser fallbacks |
| `docs/typora-syntax-survey.md` | Compatibility status changes |
| `README.md` | User-facing behavior, install, or API changes |

Prefer ProseMirror decorations for visual source hints and previews when text
must remain editable. If a NodeView adds DOM outside the editable source, it
must handle its own events and mutations without confusing ProseMirror.

## Specs And Tests

Feature specs are executable examples. Each spec includes:

- `seed`: Markdown loaded before events run.
- `events`: the keystrokes or commands to replay.
- `checkpoints`: expected rendered output after specific event counts.

Run the relevant narrow test first, then the full suite:

```sh
pnpm test tests/features/fenced-code.test.ts
pnpm test
```

Before marking work complete, run:

```sh
pnpm test
pnpm build
pnpm build:lib
git diff --check
```

If the website behavior changes, also run a browser smoke test through
`pnpm dev`.

## Code Style

- Use TypeScript and native DOM APIs.
- Keep files small enough that each module has one clear responsibility.
- Prefer structured parsers and established libraries over ad hoc parsing.
- Do not introduce unrelated refactors.
- Add comments only when they explain a non-obvious contract or algorithm.
- Do not commit temporary files, logs, screenshots, `.playwright-mcp/`, or local
  scratch notes.

## Dependency Policy

Dependencies are allowed when they are the correct domain tool and keep the
implementation closer to Typora-compatible behavior.

Current examples:

- `markdown-it` for CommonMark parsing.
- `prosemirror-*` for editing state and view behavior.
- `codemirror` 5 for code-block tokenization.
- `katex` for math rendering.
- `mermaid` for Mermaid diagrams.
- `dompurify` for sanitized HTML block rendering.

Use `pnpm add` or `pnpm remove` for dependency changes. Do not edit dependency
metadata by hand unless you are also updating the lockfile through pnpm.

## Commit Rules

This repository strictly follows
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).
Read [docs/git-commit-convention.md](docs/git-commit-convention.md) before
committing.

Required format:

```text
<type>[optional scope]: <description>
```

Examples:

```text
feat(markdown): add CodeMirror code block highlighting
fix(shortcuts): preserve hard break cursor placement
docs(readme): clarify setup and contribution flow
test(themes): cover built-in appearance switching
chore(release): prepare v0.6-beta.1
```

Do not bundle unrelated work into one commit. Split commits by logical change:
feature code, tests, docs, build metadata, and release metadata should be
separate when they are separate concerns.

## Pull Request Checklist

Before opening a PR:

- The change is scoped and does not include unrelated cleanup.
- New or changed behavior has tests or specs.
- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm build:lib` passes.
- `git diff --check` passes.
- README or docs are updated when user-facing behavior changes.
- Commits follow the repository commit convention.

In the PR description, include:

- What changed.
- Why it changed.
- How it was verified.
- Any known limitations or migration notes.

## Reporting Bugs

A strong bug report includes:

- Browser and operating system.
- Seed Markdown.
- Exact event sequence or reproduction steps.
- Expected Typora behavior.
- Actual typora-web behavior.
- Screenshots or screen recordings only when text reproduction is not enough.

For editor behavior bugs, prefer reporting through the spec catalog when
possible because it captures the seed, events, and observed output.

## Requesting Features

Feature requests should describe the Typora behavior to match, not only the
implementation idea. Include links to official syntax references when relevant.

For Markdown syntax, cite:

- CommonMark 0.31.2 for baseline syntax.
- GitHub Flavored Markdown for GFM behavior.
- Typora documentation for Typora-specific extensions.

## Releases

This project is beta-only until the owner explicitly marks a version as
production-ready. Follow [docs/release-process.md](docs/release-process.md) for
release work.

Release tags use:

- `vx.x-beta.x` for beta milestones.
- `vx.x.x` only for production releases approved by the owner.

GitHub releases must include detailed Markdown release notes and be marked as
prereleases while the project remains unstable.
