import type { FeatureSpecs } from "../_types.ts";

export const autolinkSpecs: FeatureSpecs = {
  name: "autolink",
  cases: [
    {
      id: "url-autolink",
      label: "<https://x.com> — autolink fires when closing `>` lands",
      seed: "",
      events: [
        "<", "h", "t", "t", "p", "s", ":", "/", "/", "x", ".", "c", "o", "m",
        ">", " ",
      ],
      checkpoints: [
        { at: 1, expect: "<|" },
        { at: 2, expect: "<h|" },
        // Pre-close: text is plain `<https://x.com` — no match yet.
        { at: 14, expect: "<https://x.com|" },
        // Closing `>` completes the pattern; autolink mark applies. Cursor
        // sits at the right edge of the span so the gray delims show.
        {
          at: 15,
          expect: "<g><</g><a:https://x.com>https://x.com</a><g>></g>|",
        },
        // Space pushes the cursor past the span → delims hide.
        { at: 16, expect: "<a:https://x.com>https://x.com</a> |" },
      ],
    },
    {
      id: "email-autolink",
      label: "<a@b.com> — email gets `mailto:` href",
      seed: "<a@b.com> ",
      events: [],
      checkpoints: [
        { at: 0, expect: "<a:mailto:a@b.com>a@b.com</a> |" },
      ],
    },
    {
      id: "bare-url-autolink",
      label: "bare https URL — Typora-style autolink without angle brackets",
      seed: "See https://spec.commonmark.org/0.31.2/ now",
      events: [],
      checkpoints: [
        {
          at: 0,
          expect: "See <a:https://spec.commonmark.org/0.31.2/>https://spec.commonmark.org/0.31.2/</a> now|",
        },
      ],
    },
    {
      id: "bare-url-trailing-punctuation",
      label: "bare URL keeps trailing sentence punctuation outside the link",
      seed: "Visit https://example.com/docs.",
      events: [],
      checkpoints: [
        {
          at: 0,
          expect: "Visit <a:https://example.com/docs>https://example.com/docs</a>.|",
        },
      ],
    },
    {
      id: "bare-url-cjk-punctuation-boundary",
      label: "bare URL stops before CJK punctuation and keeps following text plain",
      seed: "裸 URL https://spec.commonmark.org/0.31.2/，以及邮箱 <hello@example.com>。",
      events: [],
      checkpoints: [
        {
          at: 0,
          expect: "裸 URL <a:https://spec.commonmark.org/0.31.2/>https://spec.commonmark.org/0.31.2/</a>，以及邮箱 <a:mailto:hello@example.com>hello@example.com</a>。|",
        },
      ],
    },
    {
      id: "non-url-not-touched",
      label: "<not a url!> — no scheme/email or HTML shape, stays plain text",
      seed: "<not a url!> ",
      events: [],
      checkpoints: [
        { at: 0, expect: "<not a url!> |" },
      ],
    },
  ],
};
