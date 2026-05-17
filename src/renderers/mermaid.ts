export type MermaidLike = {
  initialize(config: { startOnLoad: false; securityLevel: "strict" }): void;
  render(id: string, code: string): Promise<{ svg: string }>;
};

export type MermaidRenderState =
  | { state: "success"; svg: string }
  | { state: "error"; message: string };

export type MermaidLoader = () => Promise<MermaidLike>;

let renderSeq = 0;
const RENDER_TIMEOUT_MS = 5000;

function isMermaidBoundarySymbol(char: string | undefined): boolean {
  return !!char && !/[\s\p{L}\p{N}_]/u.test(char);
}

export function normalizeMermaidSourceForRender(code: string): string {
  let out = "";
  for (let i = 0; i < code.length; i++) {
    const char = code[i]!;
    if (char !== "\n") {
      out += char;
      continue;
    }
    const prev = out.at(-1);
    const next = code[i + 1];
    if (isMermaidBoundarySymbol(prev)) out += " ";
    out += "\n";
    if (isMermaidBoundarySymbol(next)) out += " ";
  }
  return out;
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    globalThis.setTimeout(() => reject(new Error("Mermaid rendering timed out")), ms);
  });
}

export function createMermaidRenderer(load: MermaidLoader, timeoutMs = RENDER_TIMEOUT_MS) {
  let mermaidPromise: Promise<MermaidLike> | null = null;
  const getMermaid = async (): Promise<MermaidLike> => {
    if (!mermaidPromise) {
      mermaidPromise = load().then((mermaid) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
        return mermaid;
      });
    }
    return mermaidPromise;
  };

  return {
    async render(code: string): Promise<MermaidRenderState> {
      try {
        const result = await Promise.race([
          (async () => {
            const mermaid = await getMermaid();
            return mermaid.render(
              `typora-web-mermaid-${++renderSeq}`,
              normalizeMermaidSourceForRender(code),
            );
          })(),
          timeout(timeoutMs),
        ]);
        return { state: "success", svg: result.svg };
      } catch (error) {
        return {
          state: "error",
          message: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}

export const mermaidRenderer = createMermaidRenderer(async () => {
  const mod = await import("mermaid");
  return mod.default as MermaidLike;
});
