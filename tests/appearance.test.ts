import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import {
  APPEARANCE_CHANGE_EVENT,
  getAppearance,
  setAppearance,
  toggleAppearance,
} from "../website/appearance.ts";
import { mountNav } from "../website/components/nav.ts";
import { setLocale } from "../website/i18n.ts";

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

  test("adds a localized top navigation toggle next to GitHub", () => {
    localStorage.clear();
    setLocale("en");
    setAppearance("light");
    const root = document.createElement("div");
    const cleanup = mountNav(root, "/");

    try {
      const actions = root.querySelector(".nav-actions");
      const github = actions?.querySelector(".github-link");
      const toggle = actions?.querySelector<HTMLButtonElement>(".appearance-toggle");

      expect(github?.nextElementSibling).toBe(toggle);
      expect(toggle?.textContent).toBe("Dark");

      toggle?.click();
      expect(getAppearance()).toBe("dark");
      expect(toggle?.textContent).toBe("Light");

      setLocale("zh");
      expect(toggle?.textContent).toBe("亮色");
    } finally {
      cleanup();
      localStorage.clear();
    }
  });
});
