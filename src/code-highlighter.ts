import CodeMirror from "codemirror";
import "codemirror/addon/runmode/runmode.js";
import "codemirror/mode/clike/clike.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/dockerfile/dockerfile.js";
import "codemirror/mode/go/go.js";
import "codemirror/mode/gfm/gfm.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/jsx/jsx.js";
import "codemirror/mode/markdown/markdown.js";
import "codemirror/mode/php/php.js";
import "codemirror/mode/powershell/powershell.js";
import "codemirror/mode/python/python.js";
import "codemirror/mode/ruby/ruby.js";
import "codemirror/mode/rust/rust.js";
import "codemirror/mode/shell/shell.js";
import "codemirror/mode/sql/sql.js";
import "codemirror/mode/swift/swift.js";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/yaml/yaml.js";

export type HighlightToken = {
  from: number;
  to: number;
  className: string;
};

type ModeSpec = string | { name: string; [key: string]: unknown };
type RunModeCallback = (text: string, style: string | null) => void;
type CodeMirrorRunMode = typeof CodeMirror & {
  runMode: (
    code: string,
    mode: ModeSpec,
    callback: RunModeCallback,
    options?: { tabSize?: number },
  ) => void;
};

const codeMirror = CodeMirror as CodeMirrorRunMode;

const MODE_BY_LANGUAGE = new Map<string, ModeSpec>([
  ["bash", "shell"],
  ["c", "text/x-csrc"],
  ["cpp", "text/x-c++src"],
  ["c++", "text/x-c++src"],
  ["cs", "text/x-csharp"],
  ["csharp", "text/x-csharp"],
  ["css", "css"],
  ["dockerfile", "dockerfile"],
  ["go", "go"],
  ["gfm", "gfm"],
  ["h", "text/x-csrc"],
  ["hpp", "text/x-c++src"],
  ["htm", "htmlmixed"],
  ["html", "htmlmixed"],
  ["java", "text/x-java"],
  ["javascript", "javascript"],
  ["js", "javascript"],
  ["json", { name: "javascript", json: true }],
  ["jsx", "jsx"],
  ["kotlin", "text/x-kotlin"],
  ["kt", "text/x-kotlin"],
  ["md", "gfm"],
  ["markdown", "gfm"],
  ["php", "php"],
  ["powershell", "powershell"],
  ["ps1", "powershell"],
  ["py", "python"],
  ["python", "python"],
  ["rb", "ruby"],
  ["ruby", "ruby"],
  ["rs", "rust"],
  ["rust", "rust"],
  ["sh", "shell"],
  ["shell", "shell"],
  ["sql", "sql"],
  ["swift", "swift"],
  ["ts", { name: "javascript", typescript: true }],
  ["tsx", { name: "jsx", typescript: true }],
  ["typescript", { name: "javascript", typescript: true }],
  ["xml", "xml"],
  ["yaml", "yaml"],
  ["yml", "yaml"],
]);

function normalizeLanguage(lang: string): string {
  return lang.trim().toLowerCase().replace(/^\./, "").split(/\s+/, 1)[0] ?? "";
}

function classNameForStyle(style: string): string {
  return Array.from(
    new Set(
      style
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((name) => `cm-${name}`),
    ),
  ).join(" ");
}

export function resolveCodeMirrorMode(lang: string): ModeSpec | null {
  const normalized = normalizeLanguage(lang);
  if (!normalized) return null;
  return MODE_BY_LANGUAGE.get(normalized) ?? null;
}

export function highlightCode(code: string, lang: string): HighlightToken[] {
  const mode = resolveCodeMirrorMode(lang);
  if (!mode || !code) return [];

  const tokens: HighlightToken[] = [];
  let offset = 0;

  try {
    codeMirror.runMode(
      code,
      mode,
      (text, style) => {
        const from = offset;
        offset += text.length;
        if (!style || text.length === 0) return;
        const className = classNameForStyle(style);
        if (className) tokens.push({ from, to: offset, className });
      },
      { tabSize: 2 },
    );
  } catch {
    return [];
  }

  return tokens;
}
