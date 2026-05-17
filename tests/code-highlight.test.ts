import { describe, expect, test } from "@voidzero-dev/vite-plus-test";

import { highlightCode } from "../src/code-highlighter.ts";
import { createEditor } from "../src/lib.ts";

describe("CodeMirror code highlighting", () => {
  test("emits official CodeMirror token classes for supported languages", () => {
    const code = 'const value = "typora";\n';
    const tokens = highlightCode(code, "js");

    const keyword = tokens.find((token) => code.slice(token.from, token.to) === "const");
    const string = tokens.find((token) => code.slice(token.from, token.to) === '"typora"');

    expect(keyword?.className.split(/\s+/)).toContain("cm-keyword");
    expect(string?.className.split(/\s+/)).toContain("cm-string");
    expect(tokens.every((token) => token.className.split(/\s+/).every((name) => name.startsWith("cm-")))).toBe(true);
  });

  test("leaves unsupported languages unstyled instead of guessing", () => {
    expect(highlightCode("plain text", "not-a-real-language")).toEqual([]);
  });

  test("renders CodeMirror classes inside editable fenced code blocks", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const editor = createEditor(host, { initialContent: '```js\nconst value = "typora";\n```' });

    try {
      const code = host.querySelector("pre code.cm-s-inner");
      expect(code).not.toBeNull();
      expect(code?.textContent).toContain('const value = "typora";');
      expect(code?.querySelector(".cm-keyword")?.textContent).toBe("const");
      expect(code?.querySelector(".cm-string")?.textContent).toBe('"typora"');
    } finally {
      editor.destroy();
      host.remove();
    }
  });
});
