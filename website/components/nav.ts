// Top navigation. Two routes (Editor, Specs) + GitHub link. The
// `current` argument tells the bar which route to mark active so the
// router doesn't have to special-case CSS.

import { onLocaleChange, toggleLocale, translateTree } from "../i18n.ts";

const GITHUB = "https://github.com/Albert-PZY/typora-web";

export function mountNav(host: HTMLElement, current: string): () => void {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = `
    <a class="brand" href="#/">typora-web</a>
    <div class="nav-links">
      <a href="#/" data-route="/" data-i18n="nav.editor"></a>
      <a href="#/specs" data-route="/specs" data-i18n="nav.specs"></a>
    </div>
    <div class="nav-actions">
      <a class="ext github-link" href="${GITHUB}" target="_blank" rel="noopener" data-i18n="nav.github" data-i18n-title="nav.githubTitle"></a>
      <button class="locale-toggle" type="button" data-i18n="nav.language" data-i18n-title="nav.languageTitle" data-i18n-aria-label="nav.languageTitle"></button>
    </div>
  `;
  for (const a of nav.querySelectorAll<HTMLAnchorElement>("[data-route]")) {
    if (a.dataset.route === current) a.classList.add("active");
  }
  const button = nav.querySelector<HTMLButtonElement>(".locale-toggle")!;
  button.addEventListener("click", toggleLocale);
  translateTree(nav);
  const off = onLocaleChange(() => translateTree(nav));
  host.append(nav);
  return () => off();
}
