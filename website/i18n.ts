export type Locale = "en" | "zh";

type Vars = Record<string, string | number | undefined>;

export const LOCALE_CHANGE_EVENT = "typora-web:localechange";

const STORAGE_KEY = "typora-web-locale";

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "nav.editor": "Editor",
    "nav.specs": "Specs",
    "nav.github": "GitHub",
    "nav.githubTitle": "Open GitHub repository",
    "nav.appearanceDark": "Dark",
    "nav.appearanceLight": "Light",
    "nav.appearanceTitle": "Switch light or dark theme",
    "nav.language": "中文",
    "nav.languageTitle": "Switch language",

    "home.toolbarLabel": "Editor tools",
    "home.open": "Open",
    "home.openTitle": "Open Markdown",
    "home.save": "Save",
    "home.saveTitle": "Save Markdown",
    "home.saveAs": "Save As",
    "home.saveAsTitle": "Save As",
    "home.focus": "Focus",
    "home.focusTitle": "Focus Mode",
    "home.typewriter": "Typewriter",
    "home.typewriterTitle": "Typewriter Mode",
    "home.footerPrefix": "The text above is editable.",
    "home.footerSpecs": "Browse specs",
    "home.footerSuffix": "for the full Typora-compatibility catalog.",
    "home.status.opened": "Opened {name}",
    "home.status.saved": "Saved {name}",
    "home.status.downloaded": "Downloaded {name}",
    "home.status.cancelled": "Cancelled",
    "home.status.unsupported": "Not supported in this browser",
    "home.status.error": "{message}",
    "home.status.failed": "Operation failed",

    "specs.title": "Spec",
    "specs.metaObject": "A spec is a typed object <code>{ id, label, seed, events[], checkpoints[] }</code> that the test runner replays through a headless EditorView and compares to the expected rendered output at each checkpoint. The spec is the source of truth; the test case is its compiled form. Edits to <code>specs/features/&lt;name&gt;.specs.ts</code> flow straight into the test suite.",
    "specs.metaCounts": "<strong>{cases}</strong> specs across <strong>{features}</strong> features. Each card replays a scripted event stream; checkpoint rows below are colored by whether the simulated output matched at mount time.",
    "specs.howTo": "How to write a spec",
    "specs.formatIntro": "A spec has four fields. <code>seed</code> is the markdown the editor parses before any events run; pass <code>\"\"</code> for an empty doc. <code>events</code> is the input stream the test feeds, one element at a time:",
    "specs.formatChar": "a single character like <code>\"a\"</code> or <code>\" \"</code> (one keystroke)",
    "specs.formatString": "a multi-character string like <code>\"hello\"</code> (fed char by char)",
    "specs.formatKey": "a named key in angle brackets: <code>&lt;Enter&gt;</code>, <code>&lt;Backspace&gt;</code>, <code>&lt;Tab&gt;</code>, <code>&lt;ArrowLeft&gt;</code>, <code>&lt;Home&gt;</code>, <code>&lt;End&gt;</code>, <code>&lt;Delete&gt;</code>",
    "specs.formatCombo": "a modifier combo: <code>&lt;Mod-z&gt;</code> (Cmd on Mac, Ctrl elsewhere), <code>&lt;Shift-Tab&gt;</code>, <code>&lt;Mod-Shift-Backspace&gt;</code>",
    "specs.checkpointIntro": "Each <code>checkpoint</code> is a <code>{ at, expect }</code> pair. <code>at</code> is the number of events to feed before asserting (so <code>at: 0</code> asserts the post-seed state, <code>at: events.length</code> asserts the final state). <code>expect</code> is the pretty-printed projection of the editor DOM after that step. Pretty tags:",
    "specs.tableTag": "Tag",
    "specs.tableMeaning": "Meaning",
    "specs.meaningPlain": "verbatim",
    "specs.meaningEm": "em",
    "specs.meaningStrong": "strong",
    "specs.meaningCode": "inline code",
    "specs.meaningStrike": "strike",
    "specs.meaningLink": "link",
    "specs.meaningAutolink": "autolink",
    "specs.meaningMarks": "highlight, sub, sup",
    "specs.meaningDelim": "gray source delimiter (cursor inside the surrounding span)",
    "specs.meaningCaret": "empty-selection caret",
    "specs.meaningSelection": "non-empty selection range",
    "specs.meaningHeading": "heading prefix (level by hash count)",
    "specs.meaningList": "list item marker",
    "specs.meaningQuote": "blockquote prefix",
    "specs.meaningBlocks": "self-closing block markers",
    "specs.meaningCheckbox": "task-list checkbox",
    "specs.filterPlaceholder": "filter by feature or label...",
    "specs.footerPrompt": "Behavior wrong or missing?",
    "specs.footerIssue": "file an issue",
    "specs.footerSuffix": "include the seed, event stream, and observed pretty.",

    "case.seedTitle": "seed",
    "case.eventsTitle": "events",
    "case.emptySeed": "(empty)",
    "case.eventCount": "{count} ev",
    "case.resetTitle": "Reset",
    "case.stepTitle": "Step",
    "case.playTitle": "Play",
    "case.copy": "copy",
    "case.copied": "copied",
    "case.checkpoints": "checkpoints",
    "case.report": "report",

    "feature.emphasis": "Italic and bold via */_ runs.",
    "feature.code": "Inline code spans with backtick fences.",
    "feature.strike": "Strikethrough via ~~...~~.",
    "feature.highlight": "Highlight via ==...== (Typora extension).",
    "feature.sub-sup": "Subscript ~x~ and superscript ^x^ (Typora extension).",
    "feature.link": "Inline links [text](url \"title\").",
    "feature.autolink": "Autolinks for bare URLs and <...> brackets.",
    "feature.image": "Inline images ![alt](src).",
    "feature.emoji": "Shortcode emoji like :smile: that resolve to glyphs.",
    "feature.html-comment": "Inline and block HTML comments.",
    "feature.html-block": "CommonMark HTML blocks shown as source text by default.",
    "feature.heading": "ATX headings #..######, with sticky draft state.",
    "feature.blockquote": "> quoted blocks, joined and split by Enter.",
    "feature.bullet_list": "Bullet and ordered lists with Typora-style staircase exit.",
    "feature.task": "Task-list items: - [ ] / - [x] checkboxes.",
    "feature.code_block": "Fenced code blocks with CodeMirror 6 editing and language input.",
    "feature.horizontal_rule": "Thematic break lines (---).",
    "feature.front-matter": "YAML front-matter at the top of a doc.",
    "feature.ref-def": "Reference link definitions [id]: url.",
    "feature.table": "Pipe tables with alignment row.",
    "feature.toc": "Auto-generated table of contents block.",
    "feature.auto_pair": "Smart pairing of brackets and quotes around selection.",
    "feature.math": "Inline and block math rendered with KaTeX.",
    "feature.diagram": "Mermaid diagram fences with lazy preview rendering.",
  },
  zh: {
    "nav.editor": "编辑器",
    "nav.specs": "规格",
    "nav.github": "GitHub",
    "nav.githubTitle": "打开 GitHub 仓库",
    "nav.appearanceDark": "暗色",
    "nav.appearanceLight": "亮色",
    "nav.appearanceTitle": "切换亮色或暗色主题",
    "nav.language": "EN",
    "nav.languageTitle": "切换语言",

    "home.toolbarLabel": "编辑器工具",
    "home.open": "打开",
    "home.openTitle": "打开 Markdown",
    "home.save": "保存",
    "home.saveTitle": "保存 Markdown",
    "home.saveAs": "另存为",
    "home.saveAsTitle": "另存为",
    "home.focus": "专注",
    "home.focusTitle": "专注模式",
    "home.typewriter": "打字机",
    "home.typewriterTitle": "打字机模式",
    "home.footerPrefix": "上方文本可直接编辑。",
    "home.footerSpecs": "查看规格",
    "home.footerSuffix": "了解完整的 Typora 兼容性目录。",
    "home.status.opened": "已打开 {name}",
    "home.status.saved": "已保存 {name}",
    "home.status.downloaded": "已下载 {name}",
    "home.status.cancelled": "已取消",
    "home.status.unsupported": "当前浏览器不支持",
    "home.status.error": "{message}",
    "home.status.failed": "操作失败",

    "specs.title": "规格",
    "specs.metaObject": "规格是一个带类型的对象 <code>{ id, label, seed, events[], checkpoints[] }</code>。测试运行器会把它回放到无头 EditorView 中，并在每个检查点比较实际渲染结果与预期输出。规格是行为来源，测试用例是它的编译结果。修改 <code>specs/features/&lt;name&gt;.specs.ts</code> 会直接进入测试套件。",
    "specs.metaCounts": "共有 <strong>{cases}</strong> 个规格，覆盖 <strong>{features}</strong> 个功能。每张卡片都会回放一段脚本事件流；下方检查点会按模拟输出是否匹配进行着色。",
    "specs.howTo": "如何编写规格",
    "specs.formatIntro": "一个规格有四个字段。<code>seed</code> 是事件执行前解析的 Markdown；空文档使用 <code>\"\"</code>。<code>events</code> 是测试逐个输入的事件流：",
    "specs.formatChar": "单个字符，例如 <code>\"a\"</code> 或 <code>\" \"</code>（一次按键）",
    "specs.formatString": "多字符字符串，例如 <code>\"hello\"</code>（会按字符逐个输入）",
    "specs.formatKey": "尖括号中的命名按键：<code>&lt;Enter&gt;</code>、<code>&lt;Backspace&gt;</code>、<code>&lt;Tab&gt;</code>、<code>&lt;ArrowLeft&gt;</code>、<code>&lt;Home&gt;</code>、<code>&lt;End&gt;</code>、<code>&lt;Delete&gt;</code>",
    "specs.formatCombo": "组合键：<code>&lt;Mod-z&gt;</code>（macOS 为 Cmd，其他系统为 Ctrl）、<code>&lt;Shift-Tab&gt;</code>、<code>&lt;Mod-Shift-Backspace&gt;</code>",
    "specs.checkpointIntro": "每个 <code>checkpoint</code> 是 <code>{ at, expect }</code>。<code>at</code> 表示断言前要输入的事件数量（<code>at: 0</code> 表示种子解析后的状态，<code>at: events.length</code> 表示最终状态）。<code>expect</code> 是编辑器 DOM 的 pretty 投影。Pretty 标签：",
    "specs.tableTag": "标签",
    "specs.tableMeaning": "含义",
    "specs.meaningPlain": "原样文本",
    "specs.meaningEm": "斜体",
    "specs.meaningStrong": "粗体",
    "specs.meaningCode": "行内代码",
    "specs.meaningStrike": "删除线",
    "specs.meaningLink": "链接",
    "specs.meaningAutolink": "自动链接",
    "specs.meaningMarks": "高亮、下标、上标",
    "specs.meaningDelim": "灰色源码定界符（光标位于对应范围内）",
    "specs.meaningCaret": "空选区光标",
    "specs.meaningSelection": "非空选区范围",
    "specs.meaningHeading": "标题前缀（层级由 # 数量决定）",
    "specs.meaningList": "列表项标记",
    "specs.meaningQuote": "引用块前缀",
    "specs.meaningBlocks": "自闭合块标记",
    "specs.meaningCheckbox": "任务列表复选框",
    "specs.filterPlaceholder": "按功能或标签筛选...",
    "specs.footerPrompt": "行为有误或缺失？",
    "specs.footerIssue": "提交 issue",
    "specs.footerSuffix": "请附上 seed、事件流和观察到的 pretty。",

    "case.seedTitle": "种子",
    "case.eventsTitle": "事件",
    "case.emptySeed": "（空）",
    "case.eventCount": "{count} 个事件",
    "case.resetTitle": "重置",
    "case.stepTitle": "单步",
    "case.playTitle": "播放",
    "case.copy": "复制",
    "case.copied": "已复制",
    "case.checkpoints": "检查点",
    "case.report": "报告问题",

    "feature.emphasis": "通过 */_ 定界符输入斜体和粗体。",
    "feature.code": "使用反引号定界符输入行内代码。",
    "feature.strike": "通过 ~~...~~ 输入删除线。",
    "feature.highlight": "通过 ==...== 输入高亮（Typora 扩展）。",
    "feature.sub-sup": "通过 ~x~ 输入下标，通过 ^x^ 输入上标（Typora 扩展）。",
    "feature.link": "行内链接 [text](url \"title\")。",
    "feature.autolink": "裸 URL 和 <...> 括号自动链接。",
    "feature.image": "行内图片 ![alt](src)。",
    "feature.emoji": "将 :smile: 这类短代码解析为 emoji。",
    "feature.html-comment": "行内和块级 HTML 注释。",
    "feature.html-block": "CommonMark HTML 块默认按源码文本显示。",
    "feature.heading": "ATX 标题 # 到 ######，支持草稿态预览。",
    "feature.blockquote": "> 引用块，支持 Enter 合并和拆分。",
    "feature.bullet_list": "无序和有序列表，带 Typora 风格阶梯退出。",
    "feature.task": "任务列表项：- [ ] / - [x] 复选框。",
    "feature.code_block": "使用 CodeMirror 6 编辑并带语言输入的围栏代码块。",
    "feature.horizontal_rule": "主题分隔线（---）。",
    "feature.front-matter": "文档顶部 YAML front matter。",
    "feature.ref-def": "引用链接定义 [id]: url。",
    "feature.table": "带对齐行的管道表格。",
    "feature.toc": "自动生成的目录块。",
    "feature.auto_pair": "括号和引号智能配对，支持包裹选区。",
    "feature.math": "用 KaTeX 渲染行内和块级数学公式。",
    "feature.diagram": "Mermaid 图表围栏，支持延迟预览渲染。",
  },
};

function supportedLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (supportedLocale(stored)) return stored;
  } catch {}
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let currentLocale: Locale = detectLocale();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale } }));
}

export function toggleLocale(): void {
  setLocale(currentLocale === "zh" ? "en" : "zh");
}

export function t(key: string, vars: Vars = {}): string {
  const template = messages[currentLocale][key] ?? messages.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

export function onLocaleChange(listener: () => void): () => void {
  window.addEventListener(LOCALE_CHANGE_EVENT, listener);
  return () => window.removeEventListener(LOCALE_CHANGE_EVENT, listener);
}

function i18nElements(root: ParentNode): Element[] {
  const own = root instanceof Element ? [root] : [];
  return [
    ...own,
    ...Array.from(
      root.querySelectorAll(
        "[data-i18n], [data-i18n-html], [data-i18n-title], [data-i18n-placeholder], [data-i18n-aria-label]",
      ),
    ),
  ];
}

export function translateTree(root: ParentNode): void {
  for (const el of i18nElements(root)) {
    const textKey = el.getAttribute("data-i18n");
    if (textKey) el.textContent = t(textKey);

    const htmlKey = el.getAttribute("data-i18n-html");
    if (htmlKey) el.innerHTML = t(htmlKey);

    const titleKey = el.getAttribute("data-i18n-title");
    if (titleKey) el.setAttribute("title", t(titleKey));

    const placeholderKey = el.getAttribute("data-i18n-placeholder");
    if (placeholderKey) el.setAttribute("placeholder", t(placeholderKey));

    const ariaKey = el.getAttribute("data-i18n-aria-label");
    if (ariaKey) el.setAttribute("aria-label", t(ariaKey));
  }
}

document.documentElement.lang = currentLocale === "zh" ? "zh-CN" : "en";
