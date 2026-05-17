---
type: contract
title: feature-contracts
summary: Contract for adding Markdown and Typora extension features.
tags:
  - features
  - markdown
owned_paths:
  - src/features/**
  - specs/features/**
  - tests/features/**
entrypoints:
  - src/features/index.ts
  - src/features/_types.ts
last_verified_commit: 6d496b1
status: active
---

# Feature Contracts

## Scope

Each supported Markdown or Typora behavior is implemented as a feature module under `src/features/` and registered once in `src/features/index.ts`.

## Producers And Consumers

- Feature modules produce `FeatureSpec` objects.
- Core schema, parser, serializer, input rules, keymaps, and plugin stack consume collected feature contributions.
- Specs under `specs/features/` produce executable cases consumed by tests and the website spec catalog.

## Interface Rules

- `nodes` and `marks` are merged into the root schema.
- `mdItPlugins` configure the shared markdown-it instance before parsing.
- `parserTokens` translate markdown-it tokens into ProseMirror nodes and text.
- `parserPostProcess` may rewrite the parsed doc once after parsing.
- `inline` features scan textblocks and expose source delimiter ranges for decorations and serialization.
- `blockHandlers` and `inlineNodeHandlers` serialize feature-owned nodes.
- `plugins` can register NodeViews, decoration providers, and event handlers.
- `keymap` commands must return `false` when their guard does not apply so chained commands can run.

## Invariants

- Feature modules should not import the website or test harness.
- Specs should describe user-observable behavior, not implementation internals.
- Heavy renderers should be lazy-loaded when possible.
- Feature UI must not break source round-trip.
- Code block highlighting must preserve the `code_block` text as editable ProseMirror content. Use inline decorations over CodeMirror 5 runmode token offsets, not manual DOM replacement inside the NodeView content DOM.

## Compatibility Notes

- CommonMark and GFM behavior should use markdown-it where possible.
- Typora extensions may be implemented outside CommonMark/GFM, but they must preserve Markdown source form.
- Fenced code languages without an imported CodeMirror mode should stay plain instead of using guessed tokenization.
