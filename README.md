# typora-web

## 中文简介

> 面向 Web 的原生、轻量、高性能 Typora 风格 Markdown 编辑器。

typora-web 让 Markdown 在编辑时尽量接近最终文档形态，同时保留可往返序列化的 Markdown 源码。源码标记会在不需要时弱化或隐藏，数学公式、Mermaid 图表、代码块、表格、任务列表等富内容会在原地呈现。

当前项目仍处于 beta 阶段，不建议直接用于生产环境。版本标签统一使用 `vx.x-beta.x` 格式，等维护者明确确认生产可用后才会发布 `vx.x.x` 版本。

快速入口：

- 在线演示：[typora-web demo][demo]
- 规格目录：[Spec catalog][demo-specs]
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 提交规范：[docs/git-commit-convention.md](docs/git-commit-convention.md)
- 发布流程：[docs/release-process.md](docs/release-process.md)

主要能力：

| 领域 | 支持情况 |
|---|---|
| 编辑模型 | 基于 ProseMirror 的所见即所得式 Markdown 编辑，保留源码结构 |
| Markdown 基线 | 使用 markdown-it CommonMark 模式对齐 CommonMark 0.31.2 |
| Typora 扩展 | 高亮、下标、上标、`[toc]`、emoji、KaTeX 数学公式、Mermaid 图表 |
| 代码块 | 使用 CodeMirror 6 嵌入式编辑器，语言候选来自官方 CodeMirror 语言数据并按需懒加载 |
| HTML 块 | 默认按源码文本显示，避免 `<details>` 等 HTML 直接变成原生控件 |
| 本地文件 | 在浏览器能力允许时打开、编辑、保存和另存为本地 `.md` 文件 |
| 视图模式 | 支持源码模式、专注模式、打字机模式、亮色和暗色主题 |
| 网站界面 | 支持中英文切换，编辑区中的文档内容不会被自动翻译 |

## English Overview

> A native, lightweight, Typora-style Markdown editor for the web.

typora-web makes Markdown feel like a finished document while it is still being
edited. Source markers fade when they are not needed, rich blocks render in
place, and the underlying Markdown remains round-trippable.

The project is built with TypeScript, ProseMirror, markdown-it, CodeMirror 6,
KaTeX, Mermaid, and native DOM APIs. It intentionally does not use Vue, React,
Svelte, or any other frontend framework.

## Links

- [Live demo][demo]
- [Spec catalog][demo-specs]
- [Contribution guide](CONTRIBUTING.md)
- [Commit convention](docs/git-commit-convention.md)
- [Release process](docs/release-process.md)
- [Syntax survey](docs/typora-syntax-survey.md)

## Status

typora-web is currently a beta project. It is useful for testing and iteration,
but it is not production-ready yet.

Version tags use the project beta format `vx.x-beta.x`. Package metadata uses
npm-compatible SemVer, for example `0.6.0-beta.1`.

## Highlights

| Area | Support |
|---|---|
| Editing model | WYSIWYG-style Markdown editing with source-preserving ProseMirror documents |
| Markdown baseline | CommonMark 0.31.2 through markdown-it CommonMark mode |
| Typora extensions | Highlight, subscript, superscript, `[toc]`, emoji shortcodes, math, and Mermaid |
| Code blocks | Editable fenced code blocks with CodeMirror 6 language support and lazy-loaded highlighting |
| Math | Inline and block math rendered with KaTeX |
| Diagrams | Mermaid fences render lazy SVG previews and keep errors contained |
| Local files | Open, edit, save, and Save As for local `.md` files where browser APIs allow it |
| Focus tools | Focus mode, typewriter mode, source mode, and common editing shortcuts |
| Appearance | Built-in light and dark appearances, no runtime external CSS theme import |
| Website chrome | English and Chinese UI switching; document content is never translated |

## Try It

Open the [live demo][demo] and edit the document directly. If you are reading
this file on GitHub, the rich editing behavior is not visible because GitHub
renders Markdown statically.

Useful shortcuts:

| Shortcut | Behavior |
|---|---|
| `Mod-/` | Toggle rendered/source mode |
| `F8` | Toggle focus mode |
| `F9` | Toggle typewriter mode |
| `Mod-b` / `Mod-i` | Toggle bold or italic |
| `Mod-k` | Create or edit a link |
| `Shift-Enter` | Insert a hard break |
| `Mod-0`..`Mod-6` | Paragraph or heading levels |
| `Mod-Shift-7` / `Mod-Shift-8` | Ordered or bullet list |
| `Mod-Shift-q` | Blockquote |
| `Mod-Shift-k` | Fenced code block |
| `Mod-Shift-m` | Math block |

`Mod` means `Cmd` on macOS and `Ctrl` elsewhere.

## Install

```sh
pnpm add typora-web
```

## Usage

```ts
import { createEditor } from "typora-web";
import "typora-web/widgets.css";
import "typora-web/theme-typora.css";
import "katex/dist/katex.min.css";

const editor = createEditor(document.querySelector("#app")!, {
  initialContent: "# Hello typora-web",
  onChange: (markdown) => {
    console.log(markdown);
  },
});
```

The required editor chrome lives in `typora-web/widgets.css`. Import one content
theme after it. The default demo imports `typora-web/theme-typora.css`.

Built-in light and dark appearances are controlled with `data-appearance` on the
document root:

```ts
document.documentElement.dataset.appearance = "dark";
document.documentElement.style.colorScheme = "dark";
```

The demo website provides this as a top-right toggle. External Typora `.css`
theme import was removed to keep the editor style surface predictable.

## Controller API

`createEditor(host, options)` returns a small controller:

| Method / field | Description |
|---|---|
| `editor.getMarkdown()` | Return the current Markdown |
| `editor.setMarkdown(markdown)` | Replace the current document |
| `editor.toggleSource()` | Toggle rendered/source mode |
| `editor.isSourceMode()` | Return whether source mode is active |
| `editor.toggleFocusMode()` | Toggle focus mode |
| `editor.setFocusMode(enabled)` | Set focus mode explicitly |
| `editor.isFocusMode()` | Return whether focus mode is active |
| `editor.toggleTypewriterMode()` | Toggle typewriter mode |
| `editor.setTypewriterMode(enabled)` | Set typewriter mode explicitly |
| `editor.isTypewriterMode()` | Return whether typewriter mode is active |
| `editor.openMarkdownFile()` | Open a local `.md` file when available |
| `editor.saveMarkdownFile()` | Save to the current file handle or fall back to Save As |
| `editor.saveMarkdownFileAs()` | Save through File System Access API or download fallback |
| `editor.getCurrentFileName()` | Return the current local file name, when known |
| `editor.focus()` | Focus the active editing surface |
| `editor.destroy()` | Destroy the editor and remove its DOM |
| `editor.view` | Advanced escape hatch to the ProseMirror `EditorView` |

Options:

| Option | Description |
|---|---|
| `initialContent` | Initial Markdown content |
| `onChange(markdown)` | Called after document transactions |
| `onFocus()` | Called when the active editing surface receives focus |
| `onBlur()` | Called when the active editing surface loses focus |

## Markdown Support

The parser is constrained by [CommonMark 0.31.2][cm]. Typora-specific behavior is
implemented as explicit, tested extensions.

Stable areas:

- Paragraphs, hard breaks, soft breaks, ATX headings, setext headings,
  blockquotes, thematic breaks, lists, task lists, tables, fenced code blocks,
  HTML blocks, math blocks, Mermaid fences, YAML front matter, and `[toc]`.
- Emphasis, strong, inline code, strikethrough, highlight, subscript,
  superscript, links, images, autolinks, emoji shortcodes, and inline math.
- Focus mode, typewriter mode, source mode, common editing shortcuts, local
  Markdown file workflows, bilingual website chrome, and built-in light/dark
  appearance.

Partial or intentionally pending areas:

- Indented code blocks parse, but serialize as fenced code.
- Reference definitions can be entered live, but markdown-it consumes
  definitions during parse.
- Some complex emphasis rule-of-three and escaped-link edge cases remain.
- Inline HTML and block HTML are preserved as literal source text by default;
  optional sanitized HTML preview remains intentionally out of scope for now.
- Mermaid is the only diagram engine currently implemented.
- Runtime import of external Typora CSS themes is intentionally not supported.

For the full compatibility matrix, see [docs/typora-syntax-survey.md](docs/typora-syntax-survey.md).

## Architecture

The codebase is organized around small feature modules:

| Path | Purpose |
|---|---|
| `src/editor-api.ts` | Public `createEditor()` controller and DOM mounting |
| `src/editor.ts` | ProseMirror plugin stack |
| `src/schema.ts` | Core schema plus feature-contributed nodes and marks |
| `src/parser.ts` | Markdown parsing through markdown-it and feature token handlers |
| `src/serializer.ts` | Markdown serialization |
| `src/features/` | One module per Markdown or Typora feature |
| `specs/features/` | Executable behavior specs |
| `tests/` | Unit tests, parser tests, round-trip tests, and spec replay tests |
| `website/` | Native demo site and spec catalog |

Feature work should preserve Markdown source form. If a visual preview is needed
while text remains editable, prefer ProseMirror decorations or NodeViews that
keep the source text in the document.

## Development

Use pnpm only:

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm build:lib
```

The test suite is spec-driven. Each behavior spec describes:

- the seed Markdown,
- the event stream,
- and the expected rendered output at each checkpoint.

The live spec catalog at [the demo specs page][demo-specs] exposes the same
fixtures in a browser.

## Contributing

Bug reports and feature requests are accepted as specs whenever possible. A good
report includes:

- the seed Markdown,
- the exact event sequence,
- the rendered output Typora produces,
- and the rendered output typora-web currently produces.

Before opening a pull request, read [CONTRIBUTING.md](CONTRIBUTING.md). Commits
must follow [Conventional Commits 1.0.0][conventional-commits] and should be
split by logical change category.

## License

[MIT](LICENSE)

[cm]: https://spec.commonmark.org/0.31.2/ "CommonMark 0.31.2"
[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits 1.0.0"
[demo]: https://albert-pzy.github.io/typora-web/ "typora-web live demo"
[demo-specs]: https://albert-pzy.github.io/typora-web/#/specs "typora-web spec catalog"
