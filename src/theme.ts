export type ThemeApplyResult = {
  name: string;
  styleElement: HTMLStyleElement;
};

const THEME_ATTR = "data-typora-web-theme";
const STORAGE_KEY = "typora-web-custom-theme";
const THEME_ROOT_CLASS = "typora-web-theme-root";

const ROOT_SELECTOR_RE = /^(html|body|:root)(?=$|[\s.#:[>+~])/;

function replaceTyporaSelectorParts(selector: string): string {
  return selector
    .replace(/#write/g, ".ProseMirror")
    .replace(/\.md-fences/g, "pre")
    .replace(/\.md-inline-math/g, "math-inline")
    .replace(/\.md-mathjax-midline/g, "math-inline")
    .replace(/\.md-focus-container/g, ".tw-focus-active")
    .replace(/\.md-focus/g, ".tw-focus-active")
    .replace(/\.md-task-list-item/g, "li")
    .replace(/\.md-toc/g, ".toc");
}

function selectorMap(selector: string, scope: string): string {
  const trimmed = selector.trim();
  const rootMatch = ROOT_SELECTOR_RE.exec(trimmed);
  if (rootMatch) {
    const root = `${scope}.${THEME_ROOT_CLASS}`;
    const rest = replaceTyporaSelectorParts(trimmed.slice(rootMatch[0].length))
      .replace(/\.typora-(?:export|dark|light)/g, "")
      .trimStart();
    if (!rest) return `${root}, ${scope} .ProseMirror, ${scope} .typora-web-source`;
    return `${root}${rest}`;
  }
  const mapped = replaceTyporaSelectorParts(trimmed);
  if (mapped.includes(".ProseMirror")) return `${scope} ${mapped}`;
  return `${scope} .ProseMirror ${mapped}`;
}

function findMatchingBrace(css: string, open: number): number {
  let depth = 0;
  let quote: "'" | '"' | null = null;
  let inComment = false;
  for (let i = open; i < css.length; i++) {
    const ch = css[i]!;
    const next = css[i + 1];
    if (inComment) {
      if (ch === "*" && next === "/") {
        inComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (ch === "\\") {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      inComment = true;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function normalizeSelectorList(selectors: string, scope: string): string {
  return Array.from(new Set(selectors
    .split(",")
    .flatMap((selector) => selectorMap(selector, scope).split(",").map((s) => s.trim()))
    .filter(Boolean)))
    .join(", ");
}

function normalizeCssBlock(css: string, scope: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) {
      out += css.slice(i);
      break;
    }
    const close = findMatchingBrace(css, open);
    if (close === -1) {
      out += css.slice(i);
      break;
    }
    const prelude = css.slice(i, open);
    const inner = css.slice(open + 1, close);
    const trimmed = prelude.trim();
    if (trimmed.startsWith("@")) {
      const atName = /^@([\w-]+)/.exec(trimmed)?.[1]?.toLowerCase() ?? "";
      const nested = atName === "media" || atName === "supports" || atName === "container";
      out += `${prelude} {${nested ? normalizeCssBlock(inner, scope) : inner}}`;
    } else if (trimmed) {
      out += `${normalizeSelectorList(prelude, scope)} {${inner}}`;
    } else {
      out += `${prelude} {${inner}}`;
    }
    i = close + 1;
  }
  return out;
}

export function normalizeTyporaThemeCss(cssText: string, scope: string): string {
  const withoutExport = cssText.replace(/@include-when-export[^;]+;/g, "");
  return normalizeCssBlock(withoutExport, scope);
}

export function clearTheme(host: HTMLElement): void {
  host.querySelectorAll(`style[${THEME_ATTR}]`).forEach((el) => el.remove());
  host.classList.remove(THEME_ROOT_CLASS);
}

export function applyThemeCss(
  host: HTMLElement,
  name: string,
  cssText: string,
): ThemeApplyResult {
  clearTheme(host);
  const scopeClass = Array.from(host.classList).find(Boolean) ?? "typora-web-theme-host";
  host.classList.add(scopeClass, THEME_ROOT_CLASS);
  const style = document.createElement("style");
  style.setAttribute(THEME_ATTR, name);
  style.textContent = normalizeTyporaThemeCss(cssText, `.${scopeClass}`);
  host.prepend(style);
  return { name, styleElement: style };
}

export function persistTheme(name: string, cssText: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, cssText }));
  } catch {}
}

export function loadPersistedTheme(): { name: string; cssText: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { name?: unknown; cssText?: unknown };
    if (typeof parsed.name !== "string" || typeof parsed.cssText !== "string") return null;
    return { name: parsed.name, cssText: parsed.cssText };
  } catch {
    return null;
  }
}

export function clearPersistedTheme(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
