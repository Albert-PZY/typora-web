[English](README.md)

# Typora-Web

> 面向 Web 的原生、轻量、高性能 Typora 风格 Markdown 编辑器。

Typora-Web 让 Markdown 在编辑时尽量接近最终文档形态，同时保留可往返序列化的 Markdown 源码。源码标记会在不需要时弱化或隐藏，数学公式、Mermaid 图表、代码块、表格、任务列表等富内容会在原地呈现。

项目使用 TypeScript、ProseMirror、markdown-it、CodeMirror 6、KaTeX、Mermaid、DOMPurify 和原生 DOM API 构建。项目不引入 Vue、React、Svelte、Angular 等前端框架。

## 来源与致谢

本项目基于 Yanzhen Yu 的原始项目 [Yuyz0112/typora-web][original-typora-web]
继续完善。当前仓库在原 MIT 许可基础上补充了更多语法支持、编辑行为、测试、文档和发布自动化。感谢原作者完成最初的设计和实现。

## 快速入口

- 在线演示：[Typora-Web demo][demo]
- 规格目录：[Spec catalog][demo-specs]
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 提交规范：[docs/git-commit-convention.md](docs/git-commit-convention.md)
- 发布流程：[docs/release-process.md](docs/release-process.md)
- 语法兼容矩阵：[docs/typora-syntax-survey.md](docs/typora-syntax-survey.md)

## 发布状态

Typora-Web 使用标准 Semantic Versioning 和稳定 GitHub Release，例如 `v0.8.0`。发布自动化基于 Conventional Commits 和 Release Please：只有合入 `feat`、`fix`、`perf` 或 breaking change 后，才会自动创建发布 PR。

## 主要能力

| 领域 | 支持情况 |
|---|---|
| 编辑模型 | 基于 ProseMirror 的所见即所得式 Markdown 编辑，保留源码结构 |
| Markdown 基线 | 使用 markdown-it CommonMark 模式对齐 CommonMark 0.31.2 |
| Typora 扩展 | 高亮、下标、上标、`[toc]`、emoji、KaTeX 数学公式、Mermaid 图表 |
| 代码块 | 使用 CodeMirror 6 嵌入式编辑器，语言候选来自官方 CodeMirror 语言数据并按需懒加载 |
| HTML 块 | 使用 DOMPurify 消毒后渲染实时预览，点击预览可展开源码 |
| 数学公式 | 使用 KaTeX 渲染行内和块级数学公式 |
| 图表 | Mermaid fenced code 会懒渲染为 SVG，错误状态保持可编辑 |
| 本地文件 | 在浏览器能力允许时打开、编辑、保存和另存为本地 `.md` 文件 |
| 视图模式 | 支持源码模式、专注模式、打字机模式和常见编辑快捷键 |
| 外观 | 内置亮色和暗色外观，不在运行时导入外部 Typora CSS 主题 |
| 网站界面 | 支持中英文切换，编辑区中的文档内容不会被自动翻译 |

## 技术选型

Typora-Web 的核心约束是原生、轻量、高性能，并尽量贴近 Typora 的编辑体验。因此项目没有引入 Vue、React、Svelte、Angular 等 UI 框架，而是使用 TypeScript、原生 DOM API 和 ProseMirror 直接构建编辑器运行时。

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

## 试用

打开 [在线演示][demo] 后可以直接编辑文档。如果你正在 GitHub 上阅读这个文件，富编辑行为不会显示，因为 GitHub 只会静态渲染 Markdown。

常用快捷键：

| 快捷键 | 行为 |
|---|---|
| `Mod-/` | 切换渲染视图和源码模式 |
| `F8` | 切换专注模式 |
| `F9` | 切换打字机模式 |
| `Mod-b` / `Mod-i` | 切换加粗或斜体 |
| `Mod-k` | 创建或编辑链接 |
| `Shift-Enter` | 插入硬换行 |
| `Mod-0`..`Mod-6` | 段落或标题级别 |
| `Mod-Shift-7` / `Mod-Shift-8` | 有序列表或无序列表 |
| `Mod-Shift-q` | 引用块 |
| `Mod-Shift-k` | fenced code 块 |
| `Mod-Shift-m` | 数学块 |

`Mod` 在 macOS 上表示 `Cmd`，其他系统上表示 `Ctrl`。

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
  initialContent: "# Hello Typora-Web",
  onChange: (markdown) => {
    console.log(markdown);
  },
});
```

`typora-web/widgets.css` 是编辑器交互控件必需样式，内容主题应在它之后导入。演示站点默认使用 `typora-web/theme-typora.css`。

亮色和暗色外观通过根节点的 `data-appearance` 控制：

```ts
document.documentElement.dataset.appearance = "dark";
document.documentElement.style.colorScheme = "dark";
```

演示网站右上角提供了对应切换控件。外部 Typora `.css` 主题运行时导入已移除，以保持编辑器样式边界可控。

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

测试套件以规格驱动。每条行为规格描述：

- 初始 Markdown；
- 事件流；
- 每个检查点的预期渲染输出。

浏览器中的规格目录和测试夹具使用同一套数据。

## 贡献

提交 bug 或功能请求时，最好提供：

- 初始 Markdown；
- 精确事件序列；
- Typora 中的预期渲染结果；
- Typora-Web 当前的实际渲染结果。

提交代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。所有提交必须遵守 [Conventional Commits 1.0.0][conventional-commits]，并按逻辑类别拆分，不要把无关修改混在一个提交里。

## 许可证

[MIT](LICENSE)

[cm]: https://spec.commonmark.org/0.31.2/ "CommonMark 0.31.2"
[conventional-commits]: https://www.conventionalcommits.org/en/v1.0.0/ "Conventional Commits 1.0.0"
[demo]: https://albert-pzy.github.io/typora-web/ "Typora-Web live demo"
[demo-specs]: https://albert-pzy.github.io/typora-web/#/specs "Typora-Web spec catalog"
[original-typora-web]: https://github.com/Yuyz0112/typora-web "Original typora-web repository"
