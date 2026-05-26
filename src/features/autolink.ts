import { markConsumed, type InlineSpan } from "../inline-parse.ts";
import type { FeatureSpec, InlineFeatureSpec } from "./_types.ts";

// CommonMark autolink: `<scheme:rest>` and `<email>`. Method-B mode —
// text keeps `<` and `>` verbatim; the inline scanner derives the mark
// when content matches a scheme-bearing URI or simplified email.
//
// We disable md-it's built-in autolink rule (mdItPlugins below). When
// a source document is parsed, `<https://x.com>` flows through as plain
// text (md-it has no other rule that swallows it once autolink + html
// are off), then normalize re-derives the mark on the next transaction.
//
// `<a>` tag rendering is handled by link.ts's renderCase (single owner
// for the tag). Autolink toDOM emits `data-autolink` so the dispatch
// can split <l:url> vs <a:url>.

// scheme-bearing URI: ASCII alpha + alphanums/.+- before `:`, then any
// non-space, non-`<>` chars. RFC 3986 is more strict but this is good
// enough for the pilot — markdown-it commonmark uses the same shape.
const URI_PART = "[a-zA-Z][a-zA-Z0-9+.-]*:[^\\s<>]+";
const EMAIL_PART =
  "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}";
const AUTOLINK_RE = new RegExp(`<((?:${URI_PART})|(?:${EMAIL_PART}))>`, "g");
const BARE_URL_RE =
  /\bhttps?:\/\/[^\s<>\]\u3000-\u303F\uFF01-\uFF0F\uFF1A-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65]+/g;

function rangeConsumed(consumed: Uint8Array, from: number, to: number): boolean {
  for (let i = from; i < to; i++) if (consumed[i]) return true;
  return false;
}

function trimBareUrl(raw: string): string {
  let end = raw.length;
  while (end > 0 && /[.,!?;:]/.test(raw[end - 1]!)) end--;
  while (end > 0 && raw[end - 1] === ")") {
    const candidate = raw.slice(0, end);
    const opens = (candidate.match(/\(/g) ?? []).length;
    const closes = (candidate.match(/\)/g) ?? []).length;
    if (closes <= opens) break;
    end--;
  }
  return raw.slice(0, end);
}

const scan: InlineFeatureSpec["scan"] = (text, consumed, parentBlock) => {
  const out: InlineSpan[] = [];
  AUTOLINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = AUTOLINK_RE.exec(text))) {
    const fullStart = m.index;
    const fullEnd = fullStart + m[0].length;
    if (rangeConsumed(consumed, fullStart, fullEnd)) continue;
    const inner = m[1]!;
    const isEmail = !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(inner);
    const href = isEmail ? `mailto:${inner}` : inner;
    markConsumed(consumed, fullStart, fullEnd);
    out.push({
      type: "autolink",
      from: fullStart + 1, // after `<`
      to: fullEnd - 1,     // before `>`
      openFrom: fullStart,
      openTo: fullStart + 1,
      closeFrom: fullEnd - 1,
      closeTo: fullEnd,
      attrs: { href },
    });
  }

  if (parentBlock?.type.name !== "link_def") {
    BARE_URL_RE.lastIndex = 0;
    while ((m = BARE_URL_RE.exec(text))) {
      const matchStart = m.index;
      if (text[matchStart - 1] === "<") continue;
      if (text.slice(0, matchStart).endsWith("](")) continue;
      if (/^\[[^\]]+\]:\s*$/.test(text.slice(0, matchStart))) continue;
      const url = trimBareUrl(m[0]);
      if (!url) continue;
      const matchEnd = matchStart + url.length;
      if (rangeConsumed(consumed, matchStart, matchEnd)) continue;
      markConsumed(consumed, matchStart, matchEnd);
      out.push({
        type: "autolink",
        from: matchStart,
        to: matchEnd,
        openFrom: matchStart,
        openTo: matchStart,
        closeFrom: matchEnd,
        closeTo: matchEnd,
        attrs: { href: url },
        delimRanges: [],
      });
    }
  }
  return out;
};

export const autolink: FeatureSpec = {
  name: "autolink",

  marks: {
    autolink: {
      attrs: { href: {} },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[data-autolink]",
          getAttrs: (el) => ({
            href: (el as HTMLElement).getAttribute("href") ?? "",
          }),
        },
      ],
      toDOM: (mark) => [
        "a",
        { href: mark.attrs.href as string, "data-autolink": "" },
        0,
      ],
    },
  },

  // CommonMark md-it would parse `<url>` as a `link_open`/`link_close` pair
  // with markup="autolink", which the link feature would then materialise as
  // a regular `[url](url)` link. Disable so the source flows through as text
  // and the inline scanner above is the single source of truth.
  mdItPlugins: [(md) => md.disable("autolink")],

  markDelims: {
    autolink: { open: "", close: "" },
  },

  // No renderCase here — link.ts owns the `<a>` tag mapping and dispatches
  // on `data-autolink` to emit `<a:url>...</a>` for autolink and
  // `<l:url>...</l>` for regular links.

  inline: {
    priority: 2.5, // before link (3); the `<...>` shape doesn't conflict with `[...](...)` anyway
    scan,
    markNames: ["autolink"],
    extRanges: (parent) => {
      // Same shape as link's extRanges but for the autolink mark: cover
      // the `<` open delim and `>` close delim plus the URI content.
      // Bare URL autolinks have no source delimiters, so they do not need
      // expansion beyond their own text range.
      const ranges: Array<[number, number]> = [];
      const autolinkType = parent.type.schema.marks.autolink;
      if (!autolinkType) return ranges;
      const source = parent.textContent;
      let start = -1;
      let off = 0;
      const flush = (end: number): void => {
        if (start < 0) return;
        if (source[start - 1] === "<" && source[end] === ">") {
          ranges.push([start - 1, end + 1]); // -1 for `<`, +1 for `>`
        } else {
          ranges.push([start, end]);
        }
        start = -1;
      };
      parent.forEach((child) => {
        if (child.isText) {
          const has = child.marks.some((mk) => mk.type === autolinkType);
          if (has) {
            if (start < 0) start = off;
          } else {
            flush(off);
          }
        }
        off += child.nodeSize;
      });
      flush(off);
      return ranges;
    },
  },

};
