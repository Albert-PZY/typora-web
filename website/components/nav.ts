// Top navigation. Two routes (Editor, Specs) + GitHub link. The
// `current` argument tells the bar which route to mark active so the
// router doesn't have to special-case CSS.

import {
  getAppearance,
  onAppearanceChange,
  toggleAppearance,
} from "../appearance.ts";
import { onLocaleChange, toggleLocale, translateTree } from "../i18n.ts";

const GITHUB = "https://github.com/Albert-PZY/typora-web";
const GITHUB_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"/></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.8A8.5 8.5 0 0 1 8.2 3.5 8.8 8.8 0 1 0 20.5 15.8Z"/></svg>`;
const SUN_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0-5.2v3m0 14v3M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12"/></svg>`;
const LANGUAGE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h9m-4.5 0v2.5m3.5 0a9 9 0 0 1-7 7m1.5-7a9 9 0 0 0 6.5 7M14 19l4-10 4 10m-6.7-3h5.4"/></svg>`;

export function mountNav(host: HTMLElement, current: string): () => void {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = `
    <a class="brand" href="#/"><img src="favicon.svg" alt="" aria-hidden="true" />Typora-Web</a>
    <div class="nav-links">
      <a href="#/specs" data-route="/specs" data-i18n="nav.specs"></a>
      <div class="editor-nav-group">
        <a href="#/" data-route="/" data-i18n="nav.editor"></a>
        ${current === "/" ? '<div class="editor-menu-bar" role="menubar" data-i18n-aria-label="home.toolbarLabel"></div>' : ""}
      </div>
    </div>
    <div class="nav-actions">
      <a class="ext github-link nav-icon" href="${GITHUB}" target="_blank" rel="noopener" data-i18n-title="nav.githubTitle" data-i18n-aria-label="nav.githubTitle">${GITHUB_ICON}</a>
      <button class="appearance-toggle nav-icon" type="button" data-i18n-title="nav.appearanceTitle" data-i18n-aria-label="nav.appearanceTitle"></button>
      <button class="locale-toggle nav-icon" type="button" data-i18n-title="nav.languageTitle" data-i18n-aria-label="nav.languageTitle">${LANGUAGE_ICON}</button>
    </div>
  `;
  for (const a of nav.querySelectorAll<HTMLAnchorElement>("[data-route]")) {
    if (a.dataset.route === current) a.classList.add("active");
  }
  const appearanceButton = nav.querySelector<HTMLButtonElement>(".appearance-toggle")!;
  const localeButton = nav.querySelector<HTMLButtonElement>(".locale-toggle")!;
  const updateAppearanceButton = (): void => {
    const next = getAppearance() === "dark" ? "light" : "dark";
    appearanceButton.dataset.appearance = next;
    appearanceButton.innerHTML = next === "light" ? SUN_ICON : MOON_ICON;
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
