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
| HTML 块 | 使用 DOMPurify 消毒后渲染预览，点击预览可展开源码 |
| 本地文件 | 在浏览器能力允许时打开、编辑、保存和另存为本地 `.md` 文件 |
| 视图模式 | 支持源码模式、专注模式、打字机模式、亮色和暗色主题 |
| 网站界面 | 支持中英文切换，编辑区中的文档内容不会被自动翻译 |

## 技术选型

typora-web 的核心约束是原生、轻量、高性能，并尽量贴近 Typora 的编辑体验。因此项目没有引入 Vue、React、Svelte、Angular 等 UI 框架，而是使用 TypeScript、原生 DOM API 和 ProseMirror 直接构建编辑器运行时。

当前技术栈如下：

| 技术 | 用途 | 选择原因 |
|---|---|---|
| TypeScript | 主要开发语言 | 为编辑器 schema、parser、serializer、controller API 提供静态约束 |
| 原生 DOM API | 网站界面和 NodeView UI | 减少运行时依赖，避免框架协调层影响编辑性能 |
| ProseMirror | 编辑状态、事务、插件、NodeView | 适合构建结构化富文本编辑器，并能保持 Markdown 源码与可视编辑之间的映射 |
| markdown-it CommonMark 模式 | Markdown 解析入口 | 对齐 CommonMark 0.31.2，并允许通过插件扩展 Typora 风格语法 |
| 自定义 serializer | Markdown 输出 | 保留支持语法的源码形态，保证编辑后仍能往返序列化 |
| CodeMirror 6 | 源码模式和代码块编辑 | 复刻 Typora 使用 CodeMirror 做代码编辑/高亮的路线，同时支持官方语言包懒加载 |
| `@codemirror/language-data` | 代码块语言候选 | 使用 CodeMirror 官方维护的语言描述，不手写语言猜测表 |
| KaTeX | 行内和块级数学公式 | 渲染速度快，适合作为本地公式预览引擎 |
| Mermaid | 图表代码块 | 对 `mermaid` fenced code 做渐进增强，语法正确时显示图示，错误时保留源码 |
| DOMPurify | HTML 块消毒 | 允许 HTML 块在预览态渲染，同时降低脚本和事件属性风险 |
| Vite Plus / TypeScript build | 开发、测试、构建 | 提供轻量的本地开发、库构建和测试运行能力 |
| pnpm | 包管理 | 保持依赖安装可复现，并遵守仓库统一的前端包管理规则 |

架构上，Markdown 只作为输入/输出边界。运行时权威数据结构是 ProseMirror `EditorState`。行内 Markdown 使用 Method-B 模型：源码分隔符仍保留在文本节点中，`normalize.ts` 从源码字符推导 marks，功能代码不直接手动维护 marks。这样可以让所见即所得体验和 Markdown 往返保存同时成立。

## 安装

```sh
pnpm add typora-web
```

## 使用方式

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

`typora-web/widgets.css` 是编辑器交互控件必需样式，内容主题应在它之后导入。演示站点默认使用 `typora-web/theme-typora.css`。亮色和暗色外观通过根节点的 `data-appearance` 控制：

```ts
document.documentElement.dataset.appearance = "dark";
document.documentElement.style.colorScheme = "dark";
```

## 控制器 API

`createEditor(host, options)` 会返回一个轻量控制器：

| 方法 / 字段 | 说明 |
|---|---|
| `editor.getMarkdown()` | 返回当前 Markdown |
| `editor.setMarkdown(markdown)` | 替换当前文档 |
| `editor.toggleSource()` | 在渲染视图和源码视图之间切换 |
| `editor.isSourceMode()` | 返回当前是否处于源码视图 |
| `editor.toggleFocusMode()` | 切换专注模式 |
| `editor.setFocusMode(enabled)` | 显式设置专注模式 |
| `editor.isFocusMode()` | 返回专注模式状态 |
| `editor.toggleTypewriterMode()` | 切换打字机模式 |
| `editor.setTypewriterMode(enabled)` | 显式设置打字机模式 |
| `editor.isTypewriterMode()` | 返回打字机模式状态 |
| `editor.openMarkdownFile()` | 在浏览器支持时打开本地 `.md` 文件 |
| `editor.saveMarkdownFile()` | 保存到当前文件句柄，或回退到另存为 |
| `editor.saveMarkdownFileAs()` | 通过 File System Access API 或下载回退执行另存为 |
| `editor.getCurrentFileName()` | 返回当前文件名 |
| `editor.focus()` | 聚焦当前激活的编辑表面 |
| `editor.destroy()` | 销毁编辑器并移除 DOM |
| `editor.view` | 高级逃生口，暴露底层 ProseMirror `EditorView` |

可用选项：

| 选项 | 说明 |
|---|---|
| `initialContent` | 初始 Markdown 内容 |
| `onChange(markdown)` | 文档事务后回调 |
| `onFocus()` | 编辑表面获得焦点时回调 |
| `onBlur()` | 编辑表面失去焦点时回调 |

## Markdown 支持

解析器以 [CommonMark 0.31.2][cm] 为约束，Typora 风格能力作为显式扩展实现。

稳定支持：

- 段落、硬换行、软换行、ATX 标题、setext 标题、引用、分割线、列表、任务列表、表格、fenced code、HTML 块、数学块、Mermaid 图表、YAML front matter 和 `[toc]`。
- 强调、加粗、行内代码、删除线、高亮、下标、上标、链接、图片、裸 URL 自动链接、emoji 短代码和行内数学公式。
- 专注模式、打字机模式、源码模式、常见编辑快捷键、本地 Markdown 文件打开/保存、网站中英文切换、内置亮色/暗色外观。

仍有限制或刻意保留的区域：

- 缩进代码块可以解析，但输出时会序列化为 fenced code。
- 引用定义可以在实时编辑中输入，但 markdown-it 会在解析阶段消费定义。
- 少数复杂 emphasis rule-of-three 和转义链接边界仍在补齐。
- HTML 块会消毒后渲染预览，点击预览可查看源码；内联 HTML 仍按文本保留。
- Mermaid 是当前唯一实现的图表引擎。
- 外部 Typora CSS 主题运行时导入已移除，项目只保留内置亮色/暗色默认样式。

完整兼容性矩阵见 [docs/typora-syntax-survey.md](docs/typora-syntax-survey.md)。

## 架构

代码按小型功能模块组织：

| 路径 | 用途 |
|---|---|
| `src/editor-api.ts` | 对外 `createEditor()` 控制器和 DOM 挂载 |
| `src/editor.ts` | ProseMirror 插件栈 |
| `src/schema.ts` | 核心 schema 以及功能模块贡献的 nodes 和 marks |
| `src/parser.ts` | 基于 markdown-it 的 Markdown 解析入口 |
| `src/serializer.ts` | Markdown 序列化 |
| `src/features/` | 每个 Markdown 或 Typora 能力一个功能模块 |
| `specs/features/` | 可执行行为规格 |
| `tests/` | 单元测试、解析测试、往返测试和规格回放测试 |
| `website/` | 原生演示站点和规格目录 |

新增功能应尽量保留 Markdown 源码形态。需要可视预览时，优先使用 ProseMirror decorations 或 NodeViews，让源码文本仍留在文档模型中。

## 开发

只使用 pnpm：

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm build:lib
```

测试套件以规格驱动。每条行为规格描述初始 Markdown、事件流以及每个检查点的渲染输出。浏览器中的规格目录和测试夹具使用同一套数据。

## 贡献

提交 bug 或功能请求时，最好提供：

- 初始 Markdown；
- 精确事件序列；
- Typora 中的预期渲染结果；
- typora-web 当前的实际渲染结果。

提交代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。所有提交必须遵守 [Conventional Commits 1.0.0][conventional-commits]，并按逻辑类别拆分，不要把无关修改混在一个提交里。

## 许可证

[MIT](LICENSE)

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
npm-compatible SemVer, for example `0.7.0-beta.1`.

## Technical Choices

typora-web is built for a native, lightweight, high-performance editing surface.
It avoids Vue, React, Svelte, Angular, and similar UI frameworks. The runtime is
plain TypeScript, DOM APIs, and ProseMirror.

| Technology | Role | Why it is used |
|---|---|---|
| TypeScript | Main implementation language | Static contracts for schema, parser, serializer, and controller APIs |
| Native DOM APIs | Website chrome and NodeView UI | Keeps runtime dependencies small and avoids framework scheduling overhead |
| ProseMirror | Editor state, transactions, plugins, NodeViews | Gives structured editing primitives while preserving Markdown source mapping |
| markdown-it CommonMark mode | Markdown parser boundary | Aligns the baseline with CommonMark 0.31.2 and supports explicit extensions |
| Custom serializer | Markdown output | Preserves supported source forms for round-trippable saves |
| CodeMirror 6 | Source mode and fenced code editing | Matches Typora's CodeMirror-based code editing path with lazy language loading |
| `@codemirror/language-data` | Language candidates | Uses official CodeMirror language descriptions instead of handwritten guesses |
| KaTeX | Inline and block math | Fast local math rendering |
| Mermaid | Diagram fences | Progressive enhancement for valid `mermaid` fenced code |
| DOMPurify | HTML block sanitization | Allows HTML block previews while removing unsafe scripts and event attributes |
| Vite Plus / TypeScript build | Development, tests, builds | Lightweight local dev server, library build, and test runner |
| pnpm | Package management | Reproducible installs and the repository-standard frontend package manager |

Markdown is an IO boundary. The runtime authority is ProseMirror `EditorState`.
Inline Markdown uses the Method-B model: delimiter characters stay in text nodes,
and `normalize.ts` derives marks from those characters. Feature code should edit
source text and let normalization rebuild marks.

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
- Block HTML renders through a DOMPurify-sanitized preview and reveals source on
  click; inline HTML is still preserved as source text.
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
