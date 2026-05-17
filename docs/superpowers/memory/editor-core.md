---
type: module_card
title: editor-core
summary: Core architecture for the ProseMirror-powered Markdown editor.
tags:
  - editor
  - prosemirror
owned_paths:
  - src/schema.ts
  - src/parser.ts
  - src/serializer.ts
  - src/editor.ts
  - src/editor-api.ts
  - src/input-rules.ts
entrypoints:
  - src/lib.ts
  - src/editor-api.ts
last_verified_commit: 54dee9b
status: active
---

# Editor Core

## Responsibilities

- Build a ProseMirror schema from core nodes plus feature-contributed nodes and marks.
- Parse Markdown through markdown-it using CommonMark mode plus feature plugins and token handlers.
- Serialize ProseMirror documents back to Markdown while preserving source delimiters used by Typora-like inline editing.
- Create the default plugin stack for history, input rules, normalization, feature plugins, syntax hints, and keymaps.
- Expose a small public controller through `createEditor()`.

## Entry Points

- `src/lib.ts` exports the library API.
- `src/editor-api.ts` owns DOM mounting, source mode, controller methods, and browser-level shortcuts.
- `src/editor.ts` owns the ProseMirror plugin stack.
- `src/features/index.ts` is the only feature registry consumed by core modules.

## Invariants

- The editor must preserve Markdown source delimiters in the document model for inline Typora-style visibility.
- `parse -> serialize -> parse` should remain lossless for supported syntax.
- Feature keymaps run before `baseKeymap`; conflicting keys are chained in feature registration order.
- `createEditor()` must stay framework-free and native DOM only.

## Extension Points

- Add schema, parser, serializer, input rules, keymaps, and plugins through a `FeatureSpec`.
- Add inline rendered syntax through `InlineFeatureSpec` plus decoration widgets when source text should remain in the document.
- Add public controller behavior in `src/editor-api.ts` only when it is user-facing API, not a feature-local concern.

## Common Pitfalls

- Direct ProseMirror marks for method-B inline syntax do not serialize unless their source delimiter text also exists in the document.
- Parser token handlers should emit source delimiters when the inline feature expects them to be present.
- NodeViews that add non-editable chrome must implement `stopEvent` and `ignoreMutation` for their chrome.
