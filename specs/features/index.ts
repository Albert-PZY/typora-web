// Aggregation of every feature's test/spec data. Imported by:
//   - tests/utils.ts (runFeatureCases drives assertions)
//   - specs/pretty.ts (collectRenderCases feeds the DOM→pretty projection)
//   - website/main.ts (specs panel — "live demo" of every case)
//
// Lib mode never imports anything under specs/, so cases + renderCases
// stay out of the editor bundle.

import type { Case, FeatureSpecs, RenderCase } from "../_types.ts";

import { autoPairSpecs } from "./auto-pair.specs.ts";
import { autolinkSpecs } from "./autolink.specs.ts";
import { blockquoteSpecs } from "./blockquote.specs.ts";
import { calloutSpecs } from "./callout.specs.ts";
import { codeSpecs } from "./code.specs.ts";
import { emojiSpecs } from "./emoji.specs.ts";
import { emphasisSpecs } from "./emphasis.specs.ts";
import { fencedCodeSpecs } from "./fenced-code.specs.ts";
import { frontMatterSpecs } from "./front-matter.specs.ts";
import { diagramSpecs } from "./diagram.specs.ts";
import { headingSpecs } from "./heading.specs.ts";
import { highlightSpecs } from "./highlight.specs.ts";
import { hrSpecs } from "./hr.specs.ts";
import { htmlCommentSpecs } from "./html-comment.specs.ts";
import { imageSpecs } from "./image.specs.ts";
import { linkSpecs } from "./link.specs.ts";
import { listSpecs } from "./list.specs.ts";
import { mathSpecs } from "./math.specs.ts";
import { refDefSpecs } from "./ref-def.specs.ts";
import { strikeSpecs } from "./strike.specs.ts";
import { subSupSpecs } from "./sub-sup.specs.ts";
import { underlineSpecs } from "./underline.specs.ts";
import { tableSpecs } from "./table.specs.ts";
import { taskSpecs } from "./task.specs.ts";
import { tocSpecs } from "./toc.specs.ts";

export const ALL_SPECS: FeatureSpecs[] = [
  htmlCommentSpecs,
  emojiSpecs,
  emphasisSpecs,
  codeSpecs,
  strikeSpecs,
  subSupSpecs,
  underlineSpecs,
  highlightSpecs,
  autolinkSpecs,
  linkSpecs,
  imageSpecs,
  hrSpecs,
  blockquoteSpecs,
  calloutSpecs,
  headingSpecs,
  taskSpecs,
  listSpecs,
  fencedCodeSpecs,
  mathSpecs,
  diagramSpecs,
  frontMatterSpecs,
  refDefSpecs,
  tableSpecs,
  tocSpecs,
  autoPairSpecs,
];

export function collectRenderCases(): Record<string, RenderCase> {
  const cases: Record<string, RenderCase> = {};
  for (const spec of ALL_SPECS) {
    for (const [tag, render] of Object.entries(spec.renderCases ?? {})) {
      const previous = cases[tag];
      cases[tag] = previous
        ? (children, el) => render(previous(children, el), el)
        : render;
    }
  }
  return cases;
}

// Cases get namespaced by feature so ids stay unique across the app.
export function collectCases(): Array<Case & { feature: string }> {
  return ALL_SPECS.flatMap((s) =>
    (s.cases ?? []).map((c) => ({ ...c, feature: s.name })),
  );
}
