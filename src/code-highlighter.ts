import {
  Compartment,
  EditorState as CodeMirrorState,
  type Extension,
} from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  HighlightStyle,
  indentOnInput,
  LanguageDescription,
  type LanguageSupport,
  syntaxHighlighting,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { markdown } from "@codemirror/lang-markdown";
import { tags } from "@lezer/highlight";
import {
  EditorView as CodeMirrorView,
  keymap,
  type ViewUpdate,
} from "@codemirror/view";

export type CodeLanguageOption = {
  name: string;
  aliases: readonly string[];
  extensions: readonly string[];
};

export const OFFICIAL_CODEMIRROR_LANGUAGE_PACKAGES = [
  "@codemirror/lang-angular",
  "@codemirror/lang-cpp",
  "@codemirror/lang-css",
  "@codemirror/lang-go",
  "@codemirror/lang-html",
  "@codemirror/lang-java",
  "@codemirror/lang-javascript",
  "@codemirror/lang-jinja",
  "@codemirror/lang-json",
  "@codemirror/lang-less",
  "@codemirror/lang-lezer",
  "@codemirror/lang-liquid",
  "@codemirror/lang-markdown",
  "@codemirror/lang-php",
  "@codemirror/lang-python",
  "@codemirror/lang-rust",
  "@codemirror/lang-sass",
  "@codemirror/lang-sql",
  "@codemirror/lang-vue",
  "@codemirror/lang-wast",
  "@codemirror/lang-xml",
  "@codemirror/lang-yaml",
] as const;

const lezerDescription = LanguageDescription.of({
  name: "Lezer",
  alias: ["lezer"],
  extensions: ["grammar"],
  load: async () => (await import("@codemirror/lang-lezer")).lezer(),
});

const codeMirrorLanguages = languages.some((language) => language.name === "Lezer")
  ? languages
  : [...languages, lezerDescription];

const typoraWebHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "var(--tw-code-comment)" },
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: "var(--tw-code-keyword)" },
  { tag: [tags.string, tags.character, tags.attributeValue], color: "var(--tw-code-string)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--tw-code-literal)" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "var(--tw-code-type)" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--tw-code-function)" },
  { tag: [tags.variableName, tags.propertyName, tags.attributeName], color: "var(--tw-code-name)" },
  { tag: [tags.operator, tags.punctuation, tags.bracket, tags.separator], color: "var(--tw-code-punctuation)" },
  { tag: [tags.meta, tags.annotation], color: "var(--tw-code-meta)" },
  { tag: tags.invalid, color: "var(--tw-code-invalid)" },
]);

export const CODE_LANGUAGE_OPTIONS: readonly CodeLanguageOption[] = codeMirrorLanguages
  .map((language) => ({
    name: language.name,
    aliases: language.alias,
    extensions: language.extensions,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

function normalizeLanguageInfo(info: string): string {
  const first = info.trim().split(/\s+/, 1)[0] ?? "";
  return first
    .replace(/^\{?\.?/, "")
    .replace(/\}?$/, "")
    .trim()
    .toLowerCase();
}

export function resolveCodeLanguage(info: string): LanguageDescription | null {
  const normalized = normalizeLanguageInfo(info);
  if (!normalized) return null;
  return (
    LanguageDescription.matchLanguageName(codeMirrorLanguages, normalized, true) ??
    LanguageDescription.matchFilename(codeMirrorLanguages, `index.${normalized}`)
  );
}

export async function loadCodeLanguage(info: string): Promise<LanguageSupport | null> {
  const description = resolveCodeLanguage(info);
  if (!description) return null;
  try {
    return await description.load();
  } catch {
    return null;
  }
}

type CodeMirrorEditorOptions = {
  parent: HTMLElement;
  doc: string;
  className: string;
  language?: string;
  markdownSource?: boolean;
  onChange?: (doc: string, update: ViewUpdate) => void;
};

export type EmbeddedCodeMirrorEditor = {
  view: CodeMirrorView;
  setDoc(doc: string): void;
  setLanguage(language: string): void;
  destroy(): void;
};

function commonExtensions(
  languageCompartment: Compartment,
  onChange?: (doc: string, update: ViewUpdate) => void,
): Extension[] {
  return [
    history(),
    keymap.of([indentWithTab, ...historyKeymap, ...defaultKeymap]),
    CodeMirrorState.tabSize.of(2),
    indentOnInput(),
    bracketMatching(),
    syntaxHighlighting(typoraWebHighlightStyle, { fallback: true }),
    CodeMirrorView.lineWrapping,
    languageCompartment.of([]),
    CodeMirrorView.updateListener.of((update) => {
      if (update.docChanged) onChange?.(update.state.doc.toString(), update);
    }),
    CodeMirrorView.theme({
      "&": {
        "--tw-code-comment": "#77736c",
        "--tw-code-keyword": "#7b4f9d",
        "--tw-code-string": "#8a5a28",
        "--tw-code-literal": "#6c6f1f",
        "--tw-code-type": "#0f766e",
        "--tw-code-function": "#2468a2",
        "--tw-code-name": "inherit",
        "--tw-code-punctuation": "#6f6a64",
        "--tw-code-meta": "#77736c",
        "--tw-code-invalid": "#b42318",
        backgroundColor: "transparent",
        color: "inherit",
        font: "inherit",
      },
      ":root[data-appearance=\"dark\"] &": {
        "--tw-code-comment": "#9a9690",
        "--tw-code-keyword": "#c9a7e8",
        "--tw-code-string": "#e5aa7a",
        "--tw-code-literal": "#c9c277",
        "--tw-code-type": "#8bc8bd",
        "--tw-code-function": "#9fbee8",
        "--tw-code-name": "inherit",
        "--tw-code-punctuation": "#c3bdb4",
        "--tw-code-meta": "#a8a29a",
        "--tw-code-invalid": "#ff8f86",
      },
      ".cm-scroller": {
        fontFamily: "inherit",
        lineHeight: "inherit",
        overflow: "visible",
        overflowX: "hidden",
      },
      ".cm-content": {
        padding: "0",
        caretColor: "currentColor",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      },
      ".cm-line": {
        padding: "0",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      },
      ".cm-gutters": {
        display: "none",
      },
      ".cm-activeLine": {
        backgroundColor: "transparent",
      },
      ".cm-focused": {
        outline: "none",
      },
      "&.cm-focused": {
        outline: "none",
      },
    }),
  ];
}

export function createEmbeddedCodeMirrorEditor(
  options: CodeMirrorEditorOptions,
): EmbeddedCodeMirrorEditor {
  const languageCompartment = new Compartment();
  const extensions = commonExtensions(languageCompartment, options.onChange);
  if (options.markdownSource) {
    extensions.push(markdown({ codeLanguages: codeMirrorLanguages }));
  }

  const view = new CodeMirrorView({
    parent: options.parent,
    state: CodeMirrorState.create({
      doc: options.doc,
      extensions,
    }),
  });
  view.dom.classList.add(options.className);
  (view.dom as HTMLElement & { __typoraWebCodeMirrorView?: CodeMirrorView })
    .__typoraWebCodeMirrorView = view;

  let languageRequest = 0;
  const setLanguage = (language: string): void => {
    if (options.markdownSource) return;
    const request = ++languageRequest;
    loadCodeLanguage(language).then((support) => {
      if (request !== languageRequest) return;
      view.dispatch({
        effects: languageCompartment.reconfigure(support ? support.extension : []),
      });
    });
  };

  if (options.language) setLanguage(options.language);

  return {
    view,
    setDoc(doc: string): void {
      const current = view.state.doc.toString();
      if (current === doc) return;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: doc },
      });
    },
    setLanguage,
    destroy(): void {
      view.destroy();
    },
  };
}
