import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";
import { homeRoute } from "../website/routes/home.ts";

describe("removed custom theme support", () => {
  test("editor controller no longer exposes runtime CSS theme import methods", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host);

    try {
      const api = editor as unknown as Record<string, unknown>;
      expect("importThemeFile" in api).toBe(false);
      expect("applyThemeCss" in api).toBe(false);
      expect("clearCustomTheme" in api).toBe(false);
      expect("getCustomThemeName" in api).toBe(false);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("home toolbar has no custom theme import or clear controls", () => {
    const root = document.createElement("div");
    const cleanup = homeRoute(root);

    try {
      expect(root.querySelector('[data-action="theme"]')).toBeNull();
      expect(root.querySelector('[data-action="clear-theme"]')).toBeNull();
      expect(root.querySelector(".editor-theme-input")).toBeNull();
    } finally {
      cleanup();
    }
  });
});
