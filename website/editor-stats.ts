export type EditorStats = {
  words: number;
  lines: number;
  characters: number;
  readingMinutes: number;
};

const CJK_RE = /[\u3400-\u9fff]/g;
const WORD_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function getEditorStats(markdown: string): EditorStats {
  const cjk = markdown.match(CJK_RE)?.length ?? 0;
  const withoutCjk = markdown.replace(CJK_RE, " ");
  const words = (withoutCjk.match(WORD_RE)?.length ?? 0) + cjk;
  return {
    words,
    lines: markdown.length === 0 ? 1 : markdown.split(/\r\n|\r|\n/).length,
    characters: Array.from(markdown).length,
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  };
}
