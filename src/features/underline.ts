import { markConsumed, markExtRanges, type InlineSpan } from "../inline-parse.ts";
import type { FeatureSpec, InlineFeatureSpec } from "./_types.ts";

const OPEN = "<u>";
const CLOSE = "</u>";

const scan: InlineFeatureSpec["scan"] = (text, consumed) => {
  const out: InlineSpan[] = [];
  let pos = 0;
  while (pos < text.length) {
    const openFrom = text.indexOf(OPEN, pos);
    if (openFrom === -1) break;
    const openTo = openFrom + OPEN.length;
    const closeFrom = text.indexOf(CLOSE, openTo);
    if (closeFrom === -1) break;
    const closeTo = closeFrom + CLOSE.length;
    let blocked = false;
    for (let i = openFrom; i < closeTo; i++) {
      if (consumed[i]) {
        blocked = true;
        break;
      }
    }
    if (!blocked && openTo < closeFrom) {
      markConsumed(consumed, openFrom, closeTo);
      out.push({
        type: "underline",
        from: openTo,
        to: closeFrom,
        openFrom,
        openTo,
        closeFrom,
        closeTo,
      });
    }
    pos = closeTo;
  }
  return out;
};

export const underline: FeatureSpec = {
  name: "underline",

  marks: {
    underline: {
      parseDOM: [{ tag: "u" }],
      toDOM: () => ["u", 0],
    },
  },

  markDelims: {
    underline: { open: "", close: "" },
  },

  inline: {
    priority: 2.2,
    scan,
    markNames: ["underline"],
    extRanges: (parent) => markExtRanges(parent, "underline", OPEN.length, CLOSE.length),
  },
};
