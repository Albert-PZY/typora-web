import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import {
  APPEARANCE_CHANGE_EVENT,
  getAppearance,
  setAppearance,
  toggleAppearance,
} from "../website/appearance.ts";
import { mountNav } from "../website/components/nav.ts";
import { getLocale, setLocale, toggleLocale } from "../website/i18n.ts";

describe("built-in appearance themes", () => {
  test("applies, persists, and toggles the document appearance", () => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-appearance");
    const seen: string[] = [];
    const listener = () => seen.push(getAppearance());
    window.addEventListener(APPEARANCE_CHANGE_EVENT, listener);

    try {
      setAppearance("dark");
      expect(getAppearance()).toBe("dark");
      expect(document.documentElement.dataset.appearance).toBe("dark");
      expect(localStorage.getItem("typora-web-appearance")).toBe("dark");

      toggleAppearance();
      expect(getAppearance()).toBe("light");
      expect(document.documentElement.dataset.appearance).toBe("light");
      expect(seen).toEqual(["dark", "light"]);
    } finally {
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, listener);
      localStorage.clear();
    }
  });

  test("uses icon-only top navigation actions with localized labels", () => {
    localStorage.clear();
    setLocale("en");
    setAppearance("light");
    const root = document.createElement("div");
    const cleanup = mountNav(root, "/");

    try {
      const actions = root.querySelector(".nav-actions");
      const github = actions?.querySelector(".github-link");
      const toggle = actions?.querySelector<HTMLButtonElement>(".appearance-toggle");
      const locale = actions?.querySelector<HTMLButtonElement>(".locale-toggle");

      expect(github?.nextElementSibling).toBe(toggle);
      expect(toggle?.nextElementSibling).toBe(locale);
      expect(github?.textContent?.trim()).toBe("");
      expect(toggle?.textContent?.trim()).toBe("");
      expect(locale?.textContent?.trim()).toBe("");
      expect(toggle?.getAttribute("aria-label")).toBe("Switch light or dark theme");
      expect(locale?.getAttribute("aria-label")).toBe("Switch language");
      expect(toggle?.dataset.appearance).toBe("dark");

      toggle?.click();
      expect(getAppearance()).toBe("dark");
      expect(toggle?.textContent?.trim()).toBe("");
      expect(toggle?.dataset.appearance).toBe("light");

      setLocale("zh");
      expect(toggle?.getAttribute("aria-label")).toBe("切换亮色或暗色主题");
    } finally {
      cleanup();
      localStorage.clear();
    }
  });

  test("toggles between supported interface locales", () => {
    setLocale("en");
    toggleLocale();
    expect(getLocale()).toBe("zh");
    toggleLocale();
    expect(getLocale()).toBe("en");
  });
});
