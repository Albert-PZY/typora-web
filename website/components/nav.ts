// Top navigation. Two routes (Editor, Specs) + GitHub link. The
// `current` argument tells the bar which route to mark active so the
// router doesn't have to special-case CSS.

import {
  getAppearance,
  onAppearanceChange,
  toggleAppearance,
} from "../appearance.ts";
import { onLocaleChange, t, toggleLocale, translateTree } from "../i18n.ts";

const GITHUB = "https://github.com/Albert-PZY/typora-web";

export function mountNav(host: HTMLElement, current: string): () => void {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = `
    <a class="brand" href="#/"><img src="/favicon.svg" alt="" aria-hidden="true" />typora-web</a>
    <div class="nav-links">
      <a href="#/" data-route="/" data-i18n="nav.editor"></a>
      <a href="#/specs" data-route="/specs" data-i18n="nav.specs"></a>
    </div>
    <div class="nav-actions">
      <a class="ext github-link" href="${GITHUB}" target="_blank" rel="noopener" data-i18n="nav.github" data-i18n-title="nav.githubTitle"></a>
      <button class="appearance-toggle" type="button" data-i18n-title="nav.appearanceTitle" data-i18n-aria-label="nav.appearanceTitle"></button>
      <button class="locale-toggle" type="button" data-i18n="nav.language" data-i18n-title="nav.languageTitle" data-i18n-aria-label="nav.languageTitle"></button>
    </div>
  `;
  for (const a of nav.querySelectorAll<HTMLAnchorElement>("[data-route]")) {
    if (a.dataset.route === current) a.classList.add("active");
  }
  const appearanceButton = nav.querySelector<HTMLButtonElement>(".appearance-toggle")!;
  const localeButton = nav.querySelector<HTMLButtonElement>(".locale-toggle")!;
  const updateAppearanceButton = (): void => {
    const key = getAppearance() === "dark" ? "nav.appearanceLight" : "nav.appearanceDark";
    appearanceButton.textContent = t(key);
  };
  const translateNav = (): void => {
    translateTree(nav);
    updateAppearanceButton();
  };
  appearanceButton.addEventListener("click", toggleAppearance);
  localeButton.addEventListener("click", toggleLocale);
  translateNav();
  const offLocale = onLocaleChange(translateNav);
  const offAppearance = onAppearanceChange(updateAppearanceButton);
  host.append(nav);
  return () => {
    offLocale();
    offAppearance();
    appearanceButton.removeEventListener("click", toggleAppearance);
    localeButton.removeEventListener("click", toggleLocale);
  };
}
