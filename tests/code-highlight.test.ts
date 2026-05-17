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
      expect(host.querySelector("datalist.cb-lang-options option[value='Python']")).not.toBeNull();
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
});
