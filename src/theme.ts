export type ThemeApplyResult = {
  name: string;
  styleElement: HTMLStyleElement;
};

const THEME_ATTR = "data-typora-web-theme";
const STORAGE_KEY = "typora-web-custom-theme";

function selectorMap(selector: string, scope: string): string {
  const trimmed = selector.trim();
  if (trimmed === "body" || trimmed === "html" || trimmed === ":root") return scope;
  if (trimmed.startsWith(".md-")) {
    return `${scope} .ProseMirror ${trimmed
      .replace(/\.md-fences/g, "pre")
      .replace(/\.md-inline-math/g, "math-inline")
      .replace(/\.md-mathjax-midline/g, "math-inline")
      .replace(/\.md-focus/g, ".tw-focus-active")
      .replace(/\.md-focus-container/g, ".tw-focus-active")
      .replace(/\.md-task-list-item/g, "li")
      .replace(/\.md-toc/g, ".toc")}`;
  }
  return `${scope} ${trimmed
    .replace(/#write/g, ".ProseMirror")
    .replace(/\.md-fences/g, "pre")
    .replace(/\.md-inline-math/g, "math-inline")
    .replace(/\.md-mathjax-midline/g, "math-inline")
    .replace(/\.md-focus/g, ".tw-focus-active")
    .replace(/\.md-focus-container/g, ".tw-focus-active")
    .replace(/\.md-task-list-item/g, "li")
    .replace(/\.md-toc/g, ".toc")}`;
}

export function normalizeTyporaThemeCss(cssText: string, scope: string): string {
  const withoutExport = cssText.replace(/@include-when-export[^;]+;/g, "");
  return withoutExport.replace(/([^{}@]+)\{/g, (full, selectors: string) => {
    if (!selectors.trim()) return full;
    const mapped = selectors
      .split(",")
      .map((selector) => selectorMap(selector, scope))
      .join(", ");
    return `${mapped} {`;
  });
}

export function clearTheme(host: HTMLElement): void {
  host.querySelectorAll(`style[${THEME_ATTR}]`).forEach((el) => el.remove());
}

export function applyThemeCss(
  host: HTMLElement,
  name: string,
  cssText: string,
): ThemeApplyResult {
  clearTheme(host);
  const scopeClass = Array.from(host.classList).find(Boolean) ?? "typora-web-theme-host";
  host.classList.add(scopeClass);
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
