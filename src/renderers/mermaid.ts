export type MermaidLike = {
  initialize(config: {
    startOnLoad: false;
    securityLevel: "strict";
    suppressErrorRendering: true;
    theme: "base" | "default";
    themeVariables?: MermaidThemeVariables;
  }): void;
  render(id: string, code: string): Promise<{ svg: string }>;
};

type MermaidThemeVariables = Record<
  string,
  string | boolean | Record<string, string | boolean>
>;

export type MermaidRenderState =
  | { state: "success"; svg: string }
  | { state: "error"; message: string };

export type MermaidLoader = () => Promise<MermaidLike>;

let renderSeq = 0;
const RENDER_TIMEOUT_MS = 5000;
const MERMAID_ERROR_SVG_RE = /Syntax error in text|mermaid version/i;
const DARK_MERMAID_THEME_VARIABLES: MermaidThemeVariables = {
  darkMode: true,
  background: "transparent",
  mainBkg: "#25272b",
  secondBkg: "#29313a",
  tertiaryColor: "#302c3d",
  primaryColor: "#2a2d33",
  primaryTextColor: "#ece7dd",
  primaryBorderColor: "#6e7681",
  secondaryColor: "#25343a",
  secondaryTextColor: "#ece7dd",
  secondaryBorderColor: "#69727d",
  tertiaryTextColor: "#ece7dd",
  tertiaryBorderColor: "#70647c",
  lineColor: "#aeb6c2",
  textColor: "#ece7dd",
  nodeTextColor: "#ece7dd",
  titleColor: "#f0d7ff",
  arrowheadColor: "#aeb6c2",
  defaultLinkColor: "#aeb6c2",
  edgeLabelBackground: "#24262a",
  clusterBkg: "#202225",
  clusterBorder: "#4a4d52",
  noteBkgColor: "#2d2a22",
  noteTextColor: "#ece7dd",
  noteBorderColor: "#8a7440",
  actorBkg: "#25272b",
  actorTextColor: "#ece7dd",
  actorBorder: "#7b8490",
  actorLineColor: "#7b8490",
  labelBoxBkgColor: "#25272b",
  labelBoxBorderColor: "#7b8490",
  signalColor: "#aeb6c2",
  signalTextColor: "#ece7dd",
  labelTextColor: "#ece7dd",
  loopTextColor: "#ece7dd",
  activationBorderColor: "#7b8490",
  activationBkgColor: "#303339",
  sequenceNumberColor: "#202225",
  sectionBkgColor: "#25272b",
  altSectionBkgColor: "#2d3036",
  sectionBkgColor2: "#25272b",
  excludeBkgColor: "#3a2f2f",
  taskBorderColor: "#6e7681",
  taskBkgColor: "#25272b",
  taskTextColor: "#ece7dd",
  taskTextOutsideColor: "#ece7dd",
  taskTextLightColor: "#202225",
  taskTextDarkColor: "#ece7dd",
  taskTextClickableColor: "#8ab4e7",
  activeTaskBorderColor: "#8ab4e7",
  activeTaskBkgColor: "#25343a",
  doneTaskBkgColor: "#2b332d",
  doneTaskBorderColor: "#62856f",
  critBorderColor: "#ff8f86",
  critBkgColor: "#452b2d",
  gridColor: "#4a4d52",
  todayLineColor: "#ffb0a8",
  vertLineColor: "#4a4d52",
  personBkg: "#25272b",
  personBorder: "#7b8490",
  rowOdd: "#24262a",
  rowEven: "#202225",
  transitionColor: "#aeb6c2",
  transitionLabelColor: "#ece7dd",
  stateLabelColor: "#ece7dd",
  stateBkg: "#25272b",
  labelBackgroundColor: "#24262a",
  compositeBackground: "#202225",
  altBackground: "#2d3036",
  compositeTitleBackground: "#302c3d",
  compositeBorder: "#6e7681",
  innerEndBackground: "#ece7dd",
  errorBkgColor: "#452b2d",
  errorTextColor: "#ffb0a8",
  specialStateColor: "#8ab4e7",
  scaleLabelColor: "#ece7dd",
  classText: "#ece7dd",
  requirementBackground: "#25272b",
  requirementBorderColor: "#6e7681",
  requirementTextColor: "#ece7dd",
  relationColor: "#aeb6c2",
  relationLabelBackground: "#24262a",
  relationLabelColor: "#ece7dd",
  branchLabelColor: "#ece7dd",
  tagLabelColor: "#ece7dd",
  tagLabelBackground: "#24262a",
  tagLabelBorder: "#6e7681",
  commitLabelColor: "#ece7dd",
  commitLabelBackground: "#24262a",
  archEdgeColor: "#aeb6c2",
  archEdgeArrowColor: "#aeb6c2",
  archGroupBorderColor: "#6e7681",
  quadrant1TextFill: "#ece7dd",
  quadrant2TextFill: "#ece7dd",
  quadrant3TextFill: "#ece7dd",
  quadrant4TextFill: "#ece7dd",
  quadrantPointTextFill: "#ece7dd",
  quadrantXAxisTextFill: "#ece7dd",
  quadrantYAxisTextFill: "#ece7dd",
  quadrantTitleFill: "#f0d7ff",
  pieTitleTextColor: "#f0d7ff",
  pieSectionTextColor: "#202225",
  pieLegendTextColor: "#ece7dd",
  pieStrokeColor: "#202225",
  vennTitleTextColor: "#f0d7ff",
  vennSetTextColor: "#ece7dd",
  wardleyEvolutionColor: "#8ab4e7",
  xyChart: {
    titleColor: "#f0d7ff",
    dataLabelColor: "#ece7dd",
    xAxisTitleColor: "#ece7dd",
    xAxisLabelColor: "#ece7dd",
    xAxisTickColor: "#aeb6c2",
    xAxisLineColor: "#aeb6c2",
    yAxisTitleColor: "#ece7dd",
    yAxisLabelColor: "#ece7dd",
    yAxisTickColor: "#aeb6c2",
    yAxisLineColor: "#aeb6c2",
    plotColorPalette: "#8ab4e7,#b994f4,#4fd1cf,#d4a72c",
  },
  packet: {
    startByteColor: "#ece7dd",
    endByteColor: "#ece7dd",
    labelColor: "#ece7dd",
    titleColor: "#f0d7ff",
    blockStrokeColor: "#6e7681",
    blockFillColor: "#25272b",
  },
  wardley: {
    axisTextColor: "#ece7dd",
    componentLabelColor: "#ece7dd",
    annotationTextColor: "#ece7dd",
  },
};

export type MermaidRenderAppearance = "light" | "dark";

export function getMermaidRenderAppearance(): MermaidRenderAppearance {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.appearance === "dark" ? "dark" : "light";
}

function mermaidConfigForAppearance(appearance: MermaidRenderAppearance) {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: appearance === "dark" ? "base" : "default",
    themeVariables: appearance === "dark" ? DARK_MERMAID_THEME_VARIABLES : {},
  } as const;
}

function shouldPadMermaidNewline(prev: string | undefined, next: string | undefined): boolean {
  return prev === ">" && next === "|";
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
    const pad = shouldPadMermaidNewline(prev, next);
    if (pad) out += " ";
    out += "\n";
    if (pad) out += " ";
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
    if (!mermaidPromise) mermaidPromise = load();
    return mermaidPromise;
  };

  return {
    async render(code: string): Promise<MermaidRenderState> {
      try {
        const result = await Promise.race([
          (async () => {
            const mermaid = await getMermaid();
            mermaid.initialize(mermaidConfigForAppearance(getMermaidRenderAppearance()));
            return mermaid.render(
              `typora-web-mermaid-${++renderSeq}`,
              normalizeMermaidSourceForRender(code),
            );
          })(),
          timeout(timeoutMs),
        ]);
        if (MERMAID_ERROR_SVG_RE.test(result.svg)) {
          return { state: "error", message: "Mermaid syntax error" };
        }
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
