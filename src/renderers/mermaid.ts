export type MermaidLike = {
  initialize(config: { startOnLoad: false; securityLevel: "strict" }): void;
  render(id: string, code: string): Promise<{ svg: string }>;
};

export type MermaidRenderState =
  | { state: "success"; svg: string }
  | { state: "error"; message: string };

export type MermaidLoader = () => Promise<MermaidLike>;

let renderSeq = 0;

export function createMermaidRenderer(load: MermaidLoader) {
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
        const mermaid = await getMermaid();
        const result = await mermaid.render(`typora-web-mermaid-${++renderSeq}`, code);
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
