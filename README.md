# typora-web

> A Typora-style Markdown editor for the web.

Markdown looks like a finished document while you write it. Italic renders as *italic* the moment you close the asterisks. Headings appear at their final size as soon as you start typing. Source markers like `*` and `#` fade out when the cursor moves away and come back when you click in.

Markdown syntax is constrained by [CommonMark 0.31.2][cm]. Typora extensions, GitHub-flavored tables/task items, math, Mermaid, CodeMirror-based code highlighting, and built-in light/dark appearances are layered on top as explicit, tested compatibility features.

It's also an experiment. Every line of source was written by an AI agent through chat. The human only chats; nothing gets typed directly into source files. To keep the agent productive at this scale, each supported syntax is described as a **spec**: a seed text, an event sequence, and the expected rendered output. Each spec compiles to a test the agent has to make pass. The result is a usable editor and a record of how far agent coding holds up on a serious project.

## Try it

> If you're reading this on GitHub, the live editing effect won't show. Visit the [live demo][demo] for the actual editor.

Inline marks: **bold**, *italic*, `inline code`, ~~strike~~, ==highlight==, sub like H~2~O, sup like E = mc^2^. Bare URLs in angle brackets become autolinks: <https://prosemirror.net>. Regular links work the usual way: [ProseMirror guide][pmguide], [CommonMark spec][cm]. Emoji shortcodes resolve as you type: :books: :tada: :hourglass: :warning:.

Task lists hold their state visually, and heavier Typora extensions render in place:

- [x] inline marks (em, strong, code, strike, highlight, sub/sup)
- [x] autolinks and reference-style links
- [x] tables with per-column alignment
- [x] sanitized CommonMark HTML blocks
- [x] inline and block math (KaTeX-based)
- [x] diagram fences like Mermaid (lazy-rendered)
- [x] CodeMirror 5 code-block highlighting, focus mode, typewriter mode, common editing shortcuts, bilingual website chrome, built-in light/dark themes, and local `.md` open/save

Lists nest, and exit on a triple-Enter staircase the way Typora does:

1. outer ordered item
   - nested bullet with a `code span`
   - another, with **bold** in it
     1. third level
2. back to the outer list

> Blockquotes render inline marks just like paragraphs do. You can drop ==highlights==, [links](https://typora.io), or `code` into a quote and the source still round-trips byte for byte.
>
> Press Enter on an empty quote line to exit.

Press `⌘/` (or `Ctrl+/`) at any time to toggle between rendered and raw source view.

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
  initialContent: "# hello",
  onChange: (md) => {
    document.title = md.split("\n", 1)[0] || "typora-web";
  },
});
```

Controller methods:

| Method / field | Description |
|---|---|
| `editor.getMarkdown()` | current markdown |
| `editor.setMarkdown(md)` | replace contents |
| `editor.toggleSource()` | flip rendered ↔ raw view (also bound to `⌘/` / `Ctrl+/`) |
| `editor.isSourceMode()` | boolean |
| `editor.toggleFocusMode()` / `editor.setFocusMode(enabled)` / `editor.isFocusMode()` | focus-mode controls (also bound to `F8`) |
| `editor.toggleTypewriterMode()` / `editor.setTypewriterMode(enabled)` / `editor.isTypewriterMode()` | typewriter-mode controls (also bound to `F9`) |
| `editor.openMarkdownFile()` | open a local `.md` file through the File System Access API when available |
| `editor.saveMarkdownFile()` | save to the current local file handle, or fall back to Save As |
| `editor.saveMarkdownFileAs()` | save through the File System Access API, or download `untitled.md` when unavailable |
| `editor.getCurrentFileName()` | current local file name, if one has been opened or saved |
| `editor.focus()` | focus the active surface |
| `editor.destroy()` | tear down |
| `editor.view` | underlying ProseMirror EditorView. No stability guarantee on this access. |

Options: `initialContent`, `onChange(md)`, `onFocus()`, `onBlur()`.

Two CSS themes ship: `typora-web/theme-typora.css` (default look on the live demo) and `typora-web/theme-github.css`. Import one. The Typora-flavored theme includes built-in light and dark appearances keyed by `data-appearance="light"` or `data-appearance="dark"` on the document root; the demo website exposes this as the top-right appearance toggle. Runtime import of external Typora `.css` theme files has been removed so the editor keeps a small, predictable style surface.

Fenced code blocks use [CodeMirror 5 runmode][cm5-runmode] and render official CodeMirror token classes such as `cm-keyword`, `cm-string`, and `cm-comment` inside the editable code block. Unknown languages stay plain instead of being guessed.

Common editing shortcuts include `Mod-b`, `Mod-i`, `Mod-k`, `Shift-Enter`, `Mod-0`..`Mod-6`, `Mod-Shift-q`, `Mod-Shift-7`, `Mod-Shift-8`, `Mod-Shift-k`, `Mod-Shift-m`, undo, and redo. `Mod` means `Cmd` on macOS and `Ctrl` elsewhere.

## Coverage

Legend: :white_check_mark: stable · :yellow_circle: partial (note explains what's missing) · :pause_button: todo.

### Block syntax

| Syntax | Status | Notes |
|---|:---:|---|
| paragraph | :white_check_mark: | |
| ATX heading `#`..`######` | :white_check_mark: | |
| setext heading (`===` / `---` underline) | :white_check_mark: | |
| blockquote `>` | :white_check_mark: | |
| bullet list `-` `*` `+` | :white_check_mark: | |
| ordered list `1.` | :white_check_mark: | |
| nested list | :white_check_mark: | |
| task list `- [ ]` / `- [x]` | :white_check_mark: | |
| fenced code ```` ``` ```` | :white_check_mark: | editable language chrome plus CodeMirror 5 token highlighting for common languages |
| indented code (4-space) | :yellow_circle: | parses fine; saves as fenced (shape attr not yet preserved) |
| thematic break `---` | :white_check_mark: | |
| table `\| a \| b \|` | :white_check_mark: | |
| YAML front matter | :white_check_mark: | |
| reference link def `[id]: url` | :yellow_circle: | live entry committed as block; reload drops the def node (markdown-it consumes it on parse) |
| HTML block | :white_check_mark: | CommonMark HTML block tokens render through DOMPurify and serialize from the original source |
| math block `$$…$$` | :white_check_mark: | rendered with KaTeX; source remains editable |
| Mermaid fenced code | :white_check_mark: | ` ```mermaid ` fences render a diagram panel lazily and preserve source |

### Inline syntax

| Syntax | Status | Notes |
|---|:---:|---|
| em `*x*` / `_x_` | :white_check_mark: | |
| strong `**x**` / `__x__` | :white_check_mark: | |
| nested `***em+strong***` | :yellow_circle: | works only when both runs ≥ 3 chars; full rule-of-three pending |
| inline code `` `x` `` | :white_check_mark: | |
| strike `~~x~~` | :white_check_mark: | |
| link `[text](url)` | :yellow_circle: | edge cases: nested `]`, `\]` escape, hrefs with spaces |
| link with title `[t](u "title")` | :white_check_mark: | |
| empty-text link `[](url)` | :white_check_mark: | |
| image `![alt](src)` | :white_check_mark: | |
| autolink `<https://x.com>` | :white_check_mark: | |
| reference-style link `[t][id]` | :yellow_circle: | resolves to inline link on parse; def block is the :yellow_circle: piece |
| hard break (2-space + `\n`) | :white_check_mark: | |
| soft break (`\n` in para) | :white_check_mark: | |
| backslash escape `\*` | :yellow_circle: | round-trip works; no input-time UX |
| inline HTML | :yellow_circle: | preserved as literal source text for now; full sanitized inline rendering is still pending |
| inline math `$x$` | :white_check_mark: | rendered with KaTeX outside code spans; source delimiters reappear near the cursor |

### Typora extensions

| Syntax | Status | Notes |
|---|:---:|---|
| highlight `==x==` | :white_check_mark: | |
| subscript `~x~` | :white_check_mark: | |
| superscript `^x^` | :white_check_mark: | |
| `[toc]` block | :white_check_mark: | |
| emoji `:smile:` | :white_check_mark: | |
| HTML comment `<!-- -->` | :white_check_mark: | |
| Mermaid diagram fences | :white_check_mark: | strict, lazy Mermaid renderer with contained error panels |
| other diagram engines (flow, sequence, Vega, …) | :pause_button: | Mermaid only for now |

### Editor behaviors

| Behavior | Status | Notes |
|---|:---:|---|
| cursor-aware delimiter hinting | :white_check_mark: | |
| auto-pair brackets | :white_check_mark: | |
| focus mode | :white_check_mark: | API + `F8`; inactive blocks dim while editing |
| typewriter mode | :white_check_mark: | API + `F9`; active cursor is scrolled toward the viewport center |
| common editing shortcuts | :white_check_mark: | source-preserving Markdown commands |
| built-in light/dark appearance | :white_check_mark: | website toggle plus `data-appearance` styles for page chrome, editor surface, widgets, and CodeMirror tokens |
| custom Typora CSS theme import | :pause_button: | intentionally removed; use the built-in default styles for now |
| website i18n | :white_check_mark: | English/Chinese switch for page chrome; editor document content is never translated |
| local `.md` open/save | :white_check_mark: | File System Access API where available; open falls back to file input and Save As falls back to download |
| lossless `parse → serialize → parse` | :white_check_mark: | |

## Spec

Specs are the project's core design choice and the harness the agent works in. Each Typora behavior is captured as a **spec**: a seed text, a sequence of input events, and the rendered output expected at each checkpoint. Every spec runs directly as a test case; the agent ships a behavior by making the test pass. Describing behaviors this way is what makes a project this size tractable for an agent to build.

The catalog lives at the [`/specs`][demo-specs] page in the live demo, where each card is a spec you can step through.

## Contributing

Bug reports and feature requests are accepted as specs. If a Typora behavior isn't matched, file an issue with:

- a **seed** (the markdown the editor starts from; can be empty)
- an **event sequence** (the keys you press; the same DSL existing specs use)
- the **rendered output** Typora produces

The "report" link on every card in the [live demo's catalog][demo-specs] prefills an issue with seed, events, and observed output ready for you to fill in.

[demo]: https://albert-pzy.github.io/typora-web/ "live demo"
[demo-specs]: https://albert-pzy.github.io/typora-web/#/specs "spec catalog"
[cm]: https://spec.commonmark.org/0.31.2/ "CommonMark 0.31.2"
[cm5-runmode]: https://codemirror.net/5/doc/manual.html#addon_runmode "CodeMirror 5 runmode"
[pmguide]: https://prosemirror.net/docs/guide/ "ProseMirror Guide"
