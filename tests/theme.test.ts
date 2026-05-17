import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { createEditor } from "../src/lib.ts";
import { applyThemeCss, clearTheme, normalizeTyporaThemeCss } from "../src/theme.ts";

describe("custom theme support", () => {
  test("normalizes common Typora selectors to the editor scope", () => {
    const css = [
      "@include-when-export url(https://example.com/font.css);",
      "body { color: red; }",
      "html { font-size: 16px; }",
      "#write { max-width: 860px; }",
      ".md-fences { background: #eee; }",
    ].join("\n");

    const normalized = normalizeTyporaThemeCss(css, ".scope");

    expect(normalized).not.toContain("@include-when-export");
    expect(normalized).toContain(".scope { color: red; }");
    expect(normalized).toContain(".scope .ProseMirror { max-width: 860px; }");
    expect(normalized).toContain(".scope .ProseMirror pre { background: #eee; }");
  });

  test("applies and clears a scoped style element", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    host.className = "theme-host";
    try {
      const result = applyThemeCss(host, "sample.css", "#write { color: red; }");
      expect(result.name).toBe("sample.css");
      expect(result.styleElement.textContent).toContain(".theme-host .ProseMirror");
      expect(host.querySelector("style[data-typora-web-theme]")).not.toBeNull();
      clearTheme(host);
      expect(host.querySelector("style[data-typora-web-theme]")).toBeNull();
    } finally {
      host.remove();
    }
  });

  test("imports, reports, persists, and clears a CSS theme through the editor API", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    localStorage.clear();
    const editor = createEditor(host);
    try {
      const file = new File(["#write { color: green; }"], "typora.css", { type: "text/css" });
      const result = await editor.importThemeFile(file);

      expect(result.status).toBe("applied");
      expect(editor.getCustomThemeName()).toBe("typora.css");
      expect(host.querySelector("style[data-typora-web-theme]")?.textContent).toContain(".ProseMirror");
      expect(localStorage.getItem("typora-web-custom-theme")).toContain("typora.css");

      editor.clearCustomTheme();
      expect(editor.getCustomThemeName()).toBeNull();
      expect(host.querySelector("style[data-typora-web-theme]")).toBeNull();
      expect(localStorage.getItem("typora-web-custom-theme")).toBeNull();
    } finally {
      editor.destroy();
      host.remove();
      localStorage.clear();
    }
  });

  test("rejects non-CSS theme files through the editor API", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host);
    try {
      const result = await editor.importThemeFile(
        new File(["not css"], "theme.txt", { type: "text/plain" }),
      );

      expect(result.status).toBe("error");
      if (result.status !== "error") throw new Error("expected theme import error");
      expect(result.message).toContain(".css");
      expect(host.querySelector("style[data-typora-web-theme]")).toBeNull();
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
