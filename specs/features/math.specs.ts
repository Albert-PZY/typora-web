import type { FeatureSpecs } from "../_types.ts";

export const mathSpecs: FeatureSpecs = {
  name: "math",
  renderCases: {
    "math-inline": (children) => `<math>${children}</math>`,
    "math-block": (children) => `$$\n${children}\n$$`,
  },
  cases: [
    {
      id: "inline-math-stable",
      label: "$E=mc^2$ renders as inline math after the cursor leaves",
      seed: "$E=mc^2$ ",
      events: [],
      checkpoints: [
        { at: 0, expect: "<math>E=mc^2</math> |" },
      ],
    },
    {
      id: "inline-math-edit",
      label: "cursor inside inline math shows source delimiters",
      seed: "$E=mc^2$",
      events: ["<Home>"],
      checkpoints: [
        { at: 1, expect: "|<g>$</g><math>E=mc^2</math><g>$</g>" },
      ],
    },
    {
      id: "inline-code-is-not-math",
      label: "`$x$` stays code, not math",
      seed: "`$x$` ",
      events: [],
      checkpoints: [
        { at: 0, expect: "<c>$x$</c> |" },
      ],
    },
    {
      id: "block-math-seed",
      label: "$$ fence parses as a block math node",
      seed: "$$\na^2+b^2=c^2\n$$",
      events: [],
      checkpoints: [
        { at: 0, expect: "$$\na^2+b^2=c^2|\n$$" },
      ],
    },
    {
      id: "block-math-enter-commit",
      label: "$$ + Enter commits to an empty math block",
      seed: "",
      events: ["$", "$", "<Enter>"],
      checkpoints: [
        { at: 2, expect: "<g>$$</g>|" },
        { at: 3, expect: "$$\n|\n$$" },
      ],
    },
  ],
};
