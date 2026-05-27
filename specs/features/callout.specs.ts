import type { FeatureSpecs } from "../_types.ts";

export const calloutSpecs: FeatureSpecs = {
  name: "callout",
  cases: [
    {
      id: "note-renders",
      label: "> [!NOTE] renders as a note alert",
      seed: "> [!NOTE]\n> body",
      events: [],
      checkpoints: [
        { at: 0, expect: "<callout:NOTE>body|</callout>" },
      ],
    },
    {
      id: "all-supported-kinds",
      label: "Supported GitHub alert kinds round-trip as callouts",
      seed: [
        "> [!NOTE]\n> note",
        "",
        "> [!TIP]\n> tip",
        "",
        "> [!IMPORTANT]\n> important",
        "",
        "> [!WARNING]\n> warning",
        "",
        "> [!DANGER]\n> danger",
      ].join("\n"),
      events: [],
      checkpoints: [
        {
          at: 0,
          expect: [
            "<callout:NOTE>note</callout>",
            "<callout:TIP>tip</callout>",
            "<callout:IMPORTANT>important</callout>",
            "<callout:WARNING>warning</callout>",
            "<callout:DANGER>danger|</callout>",
          ].join("\n"),
        },
      ],
    },
    {
      id: "enter-converts-marker",
      label: "Enter after a raw marker converts the blockquote in place",
      seed: "",
      events: [">", " ", "[", "!", "N", "O", "T", "E", "]", "<Enter>"],
      checkpoints: [
        { at: 9, expect: "<callout:NOTE>|</callout>" },
      ],
    },
    {
      id: "shift-enter-converts-marker",
      label: "Shift-Enter after a raw marker also converts the blockquote",
      seed: "",
      events: [">", " ", "[", "!", "T", "I", "P", "]", "<Shift-Enter>"],
      checkpoints: [
        { at: 8, expect: "<callout:TIP>|</callout>" },
      ],
    },
  ],
};
