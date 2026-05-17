# Contributing

## 中文贡献指南

感谢你帮助改进 typora-web。这个项目的目标是在 Web 端尽量复刻 Typora 的 Markdown 编辑体验，同时保持原生、轻量、高性能和可测试。

## 项目原则

- 使用 TypeScript、DOM API、ProseMirror、markdown-it、CodeMirror 6、KaTeX、Mermaid 等轻量库，不引入 Vue、React、Svelte、Angular 等前端框架。
- Markdown 基线严格遵守 CommonMark 0.31.2；Typora 风格行为必须作为明确扩展实现，并配套测试。
- 优先保留 Markdown 源码结构。任何渲染预览都不能破坏序列化所需的源文本。
- 前端命令统一使用 `pnpm`，不要使用 `npm`。
- 变更行为前先补测试或规格，优先运行窄范围测试，再运行完整验证。
- 提交必须遵守 `docs/git-commit-convention.md`，不同类型的修改要拆分成多次提交。
- 阶段性大改动发布前必须按 `docs/release-process.md` 准备版本号和 release notes。

## 开发环境

```sh
pnpm install
pnpm dev
```

常用脚本：

| 命令 | 用途 |
|---|---|
| `pnpm dev` | 启动演示站点 |
| `pnpm test` | 运行完整测试套件 |
| `pnpm build` | 类型检查并构建站点 |
| `pnpm build:lib` | 类型检查并构建库包 |
| `pnpm preview` | 预览生产构建结果 |

在 Windows 上编辑文件时，先重新读取当前文件内容，优先使用小而集中的补丁，并确保生成文件是 UTF-8 无 BOM。

## 修改代码前

1. 先阅读相关现有模块。
2. 检查 `src/features/index.ts` 中的功能注册。
3. 查找 `specs/features/` 中是否已有对应规格。
4. 行为变更必须先添加或更新测试。
5. 保持修改范围聚焦，不做无关重构。

## 功能开发流程

多数编辑器行为应放在 `src/features/` 下的功能模块中。

常见改动位置：

| 路径 | 何时更新 |
|---|---|
| `src/features/<feature>.ts` | schema、parser、serializer、keymap、plugin 或 NodeView 行为变化 |
| `specs/features/<feature>.specs.ts` | 用户可观察的编辑行为变化 |
| `tests/features/<feature>.test.ts` | 规格回放入口 |
| `tests/*.test.ts` | 纯函数、公开 API 或浏览器回退行为的聚焦测试 |
| `docs/typora-syntax-survey.md` | 兼容性状态变化 |
| `README.md` | 用户可见行为、安装方式或 API 变化 |

当源码文本必须保持可编辑时，优先使用 ProseMirror decorations 提供视觉提示或预览。如果 NodeView 在可编辑源码之外添加 DOM，它必须自行处理事件和 mutation，避免干扰 ProseMirror。

## 规格与测试

功能规格是可执行示例。每条规格通常包含：

- `seed`：事件开始前加载的 Markdown；
- `events`：需要回放的按键或命令；
- `checkpoints`：特定事件计数后的预期渲染输出。

优先运行最窄的相关测试，再运行完整验证：

```sh
pnpm test tests/features/fenced-code.test.ts
pnpm test
```

完成前至少运行：

```sh
pnpm test
pnpm build
pnpm build:lib
git diff --check
```

如果网站行为发生变化，还应通过 `pnpm dev` 做浏览器冒烟验证。

## 代码风格

- 使用 TypeScript 和原生 DOM API。
- 保持模块职责清晰，避免文件变成无边界的混合实现。
- 优先使用结构化 parser 和成熟库，不做脆弱的临时字符串处理。
- 不引入无关重构。
- 只有在解释非显而易见的契约或算法时才添加注释。
- 不提交临时文件、日志、截图、`.playwright-mcp/` 或本地草稿。

## 依赖策略

依赖可以添加，但必须是正确的领域工具，并且能让实现更接近 Typora 兼容行为。

当前示例：

- `markdown-it` 用于 CommonMark 解析。
- `prosemirror-*` 用于编辑状态和视图行为。
- `@codemirror/*` 用于源码模式、代码块编辑和语言高亮。
- `katex` 用于数学公式渲染。
- `mermaid` 用于 Mermaid 图表。
- `dompurify` 用于 HTML 块消毒渲染。

依赖变更必须使用 `pnpm add` 或 `pnpm remove`，不要手写依赖元数据后忘记更新 lockfile。

## 提交规则

本仓库严格遵守 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)。提交前必须阅读 [docs/git-commit-convention.md](docs/git-commit-convention.md)。

必需格式：

```text
<type>[optional scope]: <description>
```

示例：

```text
feat(markdown): add CodeMirror code block highlighting
fix(shortcuts): preserve hard break cursor placement
docs(readme): clarify setup and contribution flow
test(themes): cover built-in appearance switching
chore(release): prepare v0.7-beta.1
```

不要把无关修改塞进一个提交。功能代码、测试、文档、构建元数据和发布元数据如果属于不同逻辑类别，就应拆分提交。

## Pull Request 检查清单

提交 PR 前确认：

- 修改范围聚焦，没有无关清理。
- 新增或变更的行为有测试或规格。
- `pnpm test` 通过。
- `pnpm build` 通过。
- `pnpm build:lib` 通过。
- `git diff --check` 通过。
- 用户可见行为变化已更新 README 或相关文档。
- 提交遵守仓库提交规范。

PR 描述应包含：

- 修改内容；
- 修改原因；
- 验证方式；
- 已知限制或迁移说明。

## 报告 Bug

高质量 bug 报告应包含：

- 浏览器和操作系统；
- 初始 Markdown；
- 精确事件序列或复现步骤；
- Typora 中的预期行为；
- typora-web 中的实际行为；
- 只有文字复现不足时再附截图或录屏。

编辑器行为问题优先通过规格目录报告，因为它能捕获 seed、events 和观察结果。

## 请求功能

功能请求应描述需要对齐的 Typora 行为，而不只是实现想法。涉及 Markdown 语法时，请引用官方语法资料。

常用参考：

- CommonMark 0.31.2 用于基线语法。
- GitHub Flavored Markdown 用于 GFM 行为。
- Typora 文档用于 Typora 特定扩展。

## 发布

项目在维护者明确标记生产可用前只发布 beta 版本。发布工作必须遵守 [docs/release-process.md](docs/release-process.md)。

版本标签规则：

- `vx.x-beta.x` 用于 beta 里程碑。
- `vx.x.x` 只用于维护者确认的生产版本。

项目尚不稳定时，GitHub Release 必须标记为 prerelease，并包含详细 Markdown release notes。

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
- `@codemirror/*` for source mode, code-block editing, and language highlighting.
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
chore(release): prepare v0.7-beta.1
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
