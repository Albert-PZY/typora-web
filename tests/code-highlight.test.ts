import { readFileSync } from "node:fs";

import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import {
  CODE_LANGUAGE_OPTIONS,
  OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES,
  loadCodeLanguage,
  resolveCodeLanguage,
} from "../src/code-highlighter.ts";
import { createEditor } from "../src/lib.ts";

describe("CodeMirror 6 code editing and highlighting", () => {
  test("lists official CodeMirror language packages and language candidates", () => {
    expect(OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES).toContain("@codemirror/lang-javascript");
    expect(OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES).toContain("@codemirror/lang-python");
    expect(OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES).toContain("@codemirror/lang-java");
    expect(OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES).toContain("@codemirror/lang-cpp");
    expect(OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES).toContain("@codemirror/lang-markdown");

    const names = new Set(CODE_LANGUAGE_OPTIONS.map((option) => option.name));
    expect(names.has("JavaScript")).toBe(true);
    expect(names.has("TypeScript")).toBe(true);
    expect(names.has("Python")).toBe(true);
    expect(names.has("HTML")).toBe(true);
  });

  test("resolves aliases without guessing unsupported languages", () => {
    expect(resolveCodeLanguage("js")?.name).toBe("JavaScript");
    expect(resolveCodeLanguage("ts")?.name).toBe("TypeScript");
    expect(resolveCodeLanguage("py")?.name).toBe("Python");
    expect(resolveCodeLanguage("not-a-real-language")).toBeNull();
  });

  test("loads language support asynchronously for highlighted code blocks", async () => {
    const support = await loadCodeLanguage("typescript");

    expect(support?.language.name).toBe("typescript");
  });

  test("mounts CodeMirror 6 inside editable fenced code blocks", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: '```js\nconst value = "typora";\n```' });

    try {
      await Promise.resolve();
      const codeEditor = host.querySelector(".typora-web-code-editor .cm-editor");
      const content = host.querySelector(".typora-web-code-editor .cm-content");
      const languageInput = host.querySelector<HTMLInputElement>(".cb-lang-input");

      expect(codeEditor).not.toBeNull();
      expect(content?.textContent).toContain('const value = "typora";');
      expect(languageInput?.value).toBe("js");
      languageInput?.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

      const menu = document.body.querySelector<HTMLElement>(".cb-lang-menu");
      expect(host.querySelector("datalist.cb-lang-options")).toBeNull();
      expect(host.querySelector(".cb-lang-menu")).toBeNull();
      expect(menu).not.toBeNull();
      expect(menu?.hidden).toBe(false);
      expect(menu?.querySelector("[data-lang-name='Python']")?.textContent).toBe("Python");
      expect(menu?.textContent).not.toContain("ecmascript");
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("language menu is viewport-positioned above the input near the bottom edge", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const oldInnerHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
    const oldInnerWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");
    const editor = createEditor(host, { initialContent: "```js\nconsole.log(1);\n```" });

    try {
      await Promise.resolve();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
      const languageInput = host.querySelector<HTMLInputElement>(".cb-lang-input");
      expect(languageInput).not.toBeNull();
      languageInput!.getBoundingClientRect = () => ({
        x: 176,
        y: 564,
        top: 564,
        right: 280,
        bottom: 588,
        left: 176,
        width: 104,
        height: 24,
        toJSON: () => ({}),
      });

      languageInput!.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

      const menu = document.body.querySelector<HTMLElement>(".cb-lang-menu");
      expect(menu).not.toBeNull();
      expect(menu?.style.position).toBe("fixed");
      expect(readFileSync("src/styles/widgets.css", "utf8")).toMatch(
        /\.cb-lang-menu \{\s+position: fixed;\s+box-sizing: border-box;/,
      );
      expect(Number.parseFloat(menu!.style.top)).toBeLessThan(564);
      expect(Number.parseFloat(menu!.style.left)).toBeGreaterThanOrEqual(8);
      expect(Number.parseFloat(menu!.style.maxHeight)).toBeGreaterThan(0);
    } finally {
      if (oldInnerHeight) Object.defineProperty(window, "innerHeight", oldInnerHeight);
      if (oldInnerWidth) Object.defineProperty(window, "innerWidth", oldInnerWidth);
      editor.destroy();
      host.remove();
    }
  });

  test("language menu resets scroll to top each time it opens", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: "```js\nconsole.log(1);\n```" });

    try {
      await Promise.resolve();
      const languageInput = host.querySelector<HTMLInputElement>(".cb-lang-input");
      expect(languageInput).not.toBeNull();

      languageInput!.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      const menu = document.body.querySelector<HTMLElement>(".cb-lang-menu");
      expect(menu).not.toBeNull();
      menu!.scrollTop = 96;

      languageInput!.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(menu!.scrollTop).toBe(0);
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("source mode uses CodeMirror markdown highlighting instead of a textarea", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, {
      initialContent: '```ts\ntype Mode = "source";\n```',
    });

    try {
      editor.toggleSource();
      await Promise.resolve();

      expect(host.querySelector("textarea.typora-web-source")).toBeNull();
      expect(host.querySelector(".typora-web-source-editor .cm-editor")).not.toBeNull();
      expect(host.querySelector(".typora-web-source-editor .cm-content")?.textContent).toContain(
        'type Mode = "source";',
      );
    } finally {
      editor.destroy();
      host.remove();
    }
  });

  test("default code block styles wrap long content instead of horizontal scrolling", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const longLine = "const value = '" + "typora-web-".repeat(40) + "';";
    const editor = createEditor(host, { initialContent: `\`\`\`js\n${longLine}\n\`\`\`` });

    try {
      await Promise.resolve();
      const cmContent = host.querySelector<HTMLElement>(".typora-web-code-editor .cm-content");
      const cmLine = host.querySelector<HTMLElement>(".typora-web-code-editor .cm-line");

      expect(cmContent).not.toBeNull();
      expect(cmLine).not.toBeNull();
      expect(getComputedStyle(cmContent!).overflowWrap).toBe("anywhere");
      expect(getComputedStyle(cmLine!).wordBreak).toBe("break-word");
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
