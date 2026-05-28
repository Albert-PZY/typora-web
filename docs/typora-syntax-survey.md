# Typora Syntax Survey

This document tracks the Markdown and Typora-extension surface used to drive specs and tests. It is intentionally broader than current support so future parity work can be planned without rediscovering the syntax map.

Sources:

- CommonMark 0.31.2: https://spec.commonmark.org/
- GitHub Flavored Markdown: https://github.github.com/gfm/
- Typora Markdown Reference: https://support.typora.io/Markdown-Reference/
- Typora Diagrams: https://support.typora.io/Draw-Diagrams-With-Markdown/

Legend: `Supported`, `Partial`, `Backlog`.

## Block Syntax

| Feature | Status | Notes |
|---|---|---|
| Paragraphs, soft breaks, hard breaks | Supported | Hard breaks serialize as two trailing spaces plus newline. |
| ATX headings `#` through `######` | Supported | Heading shortcuts `Mod-1` through `Mod-6` create ATX headings. |
| Setext headings | Supported | Parser and serializer preserve setext shape for h1/h2. |
| Blockquotes | Supported | Includes shortcut wrapping and nested inline syntax. |
| Bullet lists and ordered lists | Supported | Common wrapping shortcuts are covered; complex loose-list fidelity remains a future target. |
| Task lists | Supported | Task markers render and round-trip. |
| Indented code blocks | Partial | Parses successfully but serializes as fenced code. |
| Fenced code blocks | Supported | Backtick fences with optional info string, editable language chrome, and CodeMirror 6 highlighting with lazy language loading. |
| Thematic breaks | Supported | Serializes as `---`. |
| Tables | Supported | GFM table alignment is represented. |
| YAML front matter | Supported | Document-leading front matter is parsed and serialized. |
| Reference link definitions | Partial | Live entry is supported, but markdown-it consumes definitions during parse. |
| HTML blocks | Supported | CommonMark HTML block tokens render through DOMPurify and serialize from the original source. |
| Math blocks `$$ ... $$` | Supported | KaTeX preview, editable source, serializer preservation, and invalid-TeX containment. |
| Mermaid fences | Supported | `mermaid` code fences render lazy diagram panels, preserve source, and the localized home demo covers the diagram families exposed by `mermaid@11.15.0`. |
| Other diagram engines | Backlog | Typora also supports Flowchart.js, sequence diagrams, Vega, and Vega-Lite; this project currently supports Mermaid only. |
| Footnote definitions | Backlog | Not implemented. |
| Callouts / GitHub alerts | Supported | `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `DANGER` render as alert blockquotes and round-trip. |

## Inline Syntax

| Feature | Status | Notes |
|---|---|---|
| Emphasis and strong | Supported | Basic and nested cases are covered. |
| Rule-of-three edge cases | Partial | Known edge cases remain for some delimiter runs. |
| Inline code | Supported | Code spans are excluded from inline math parsing. |
| Strikethrough | Supported | GFM-style `~~text~~`. |
| Underline | Supported | Typora-style `<u>text</u>` inline underline. |
| Links | Partial | Common inline, title, empty-text, and autolink cases work; some escaped-bracket and whitespace href cases remain. |
| Reference-style links | Partial | Link resolves on parse; definition-block preservation is the remaining gap. |
| Images | Supported | Inline image syntax is covered. |
| Image size extensions | Partial | HTML `<img>` width and height attributes are preserved and previewed; non-HTML Markdown image dimension variants remain backlog. |
| Autolinks | Supported | Angle-bracket URLs and email autolinks are supported. |
| Bare URL autolinks | Supported | Typora-style bare `http://` and `https://` URLs link without angle brackets; trailing sentence punctuation stays outside the link. |
| Hard breaks and soft breaks | Supported | Both are covered by parser and serializer tests. |
| Backslash escapes | Partial | Round-trip is supported; input-time UX is limited. |
| Inline HTML | Backlog | Paired with the HTML block trust-policy decision. |
| Inline math `$...$` | Supported | KaTeX widget preview outside code spans; invalid TeX is contained. |
| Highlight `==text==` | Supported | Typora extension. |
| Subscript `~text~` | Supported | Typora extension. |
| Superscript `^text^` | Supported | Typora extension. |
| Emoji shortcodes | Supported | Uses `markdown-it-emoji` data. |
| Footnote references | Backlog | Not implemented. |

## Editor Behaviors

| Behavior | Status | Notes |
|---|---|---|
| Cursor-aware delimiter hinting | Supported | Source markers reappear near the cursor. |
| Auto-pair brackets | Supported | Covered by feature specs. |
| Source mode toggle | Supported | `Mod-/` switches between rendered and raw Markdown. |
| Focus mode | Supported | API methods and `F8` toggle active-block focus. |
| Typewriter mode | Supported | API methods and `F9` request cursor centering. |
| Common editing shortcuts | Supported | Source-preserving commands cover inline marks, links, breaks, headings, quote/list wrapping, code block, math block, undo, and redo. |
| Built-in light/dark appearance | Supported | The website and Typora-flavored editor theme use `data-appearance` for default light and dark styles. |
| Custom Typora CSS theme import | Backlog | Runtime external CSS theme import has been removed; built-in styles are the supported path for now. |
| Local `.md` open/save | Supported | File System Access API is used when available; open falls back to a native file input and Save As falls back to a download. |
| Lossless parser/serializer round-trip | Supported | Covered across the spec suite for supported syntax. |

## Risk Areas For Future Parity

- Inline HTML still needs a deliberate sanitizer and trust model before it can safely match Typora.
- Non-Mermaid diagram engines need separate lazy renderer adapters and error panels.
- Reference definitions need a parser strategy that preserves definitions instead of allowing markdown-it to consume them.
- Exact Typora list looseness, indentation shape, and alternate ordered-list markers need more fixture coverage.
- Footnotes should be added as explicit specs before implementation.
