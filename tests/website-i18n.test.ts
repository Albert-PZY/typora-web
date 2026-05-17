import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import {
  getLocale,
  setLocale,
  t,
  translateTree,
} from "../website/i18n.ts";

describe("website i18n", () => {
  test("switches between English and Chinese dictionaries", () => {
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("nav.editor")).toBe("Editor");

    setLocale("zh");
    expect(getLocale()).toBe("zh");
    expect(t("nav.editor")).toBe("编辑器");
  });

  test("interpolates status messages", () => {
    setLocale("zh");
    expect(t("home.status.opened", { name: "note.md" })).toBe("已打开 note.md");

    setLocale("en");
    expect(t("home.status.opened", { name: "note.md" })).toBe("Opened note.md");
  });

  test("translates text and common attributes in a DOM subtree", () => {
    setLocale("zh");
    const root = document.createElement("div");
    root.innerHTML = `
      <button data-i18n="home.open" data-i18n-title="home.openTitle"></button>
      <input data-i18n-placeholder="specs.filterPlaceholder" />
      <section data-i18n-aria-label="home.toolbarLabel"></section>
    `;

    translateTree(root);

    expect(root.querySelector("button")?.textContent).toBe("打开");
    expect(root.querySelector("button")?.getAttribute("title")).toBe("打开 Markdown");
    expect(root.querySelector("input")?.getAttribute("placeholder")).toBe("按功能或标签筛选...");
    expect(root.querySelector("section")?.getAttribute("aria-label")).toBe("编辑器工具");
  });
});
