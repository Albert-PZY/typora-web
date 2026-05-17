import type { FeatureSpecs } from "../_types.ts";

export const diagramSpecs: FeatureSpecs = {
  name: "diagram",
  cases: [
    {
      id: "mermaid-fence",
      label: "```mermaid renders a diagram-aware fenced block",
      seed: "```mermaid\ngraph TD\n  A --> B\n```",
      events: [],
      checkpoints: [
        {
          at: 0,
          expect:
            "```mermaid\n" +
            "graph TD\n" +
            "  A --> B|\n" +
            "```\n" +
            "<diagram:loading/>",
        },
      ],
    },
  ],
};
