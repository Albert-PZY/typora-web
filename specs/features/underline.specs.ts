import type { FeatureSpecs } from "../_types.ts";

export const underlineSpecs: FeatureSpecs = {
  name: "underline",
  renderCases: {
    u: (children) => `<u>${children}</u>`,
  },
  cases: [
    {
      id: "html-u",
      label: "underline via <u> tags",
      seed: "",
      events: ["<", "u", ">", "t", "e", "x", "t", "<", "/", "u", ">", " "],
      checkpoints: [
        { at: 3, expect: "<u>|" },
        { at: 7, expect: "<u>text|" },
        { at: 11, expect: "<g><u></g><u>text</u><g></u></g>|" },
        { at: 12, expect: "<u>text</u> |" },
      ],
    },
  ],
};
