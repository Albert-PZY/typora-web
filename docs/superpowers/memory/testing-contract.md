---
type: contract
title: testing-contract
summary: How behavior specs and unit tests prove editor compatibility.
tags:
  - tests
  - specs
owned_paths:
  - specs/**
  - tests/**
entrypoints:
  - tests/utils.ts
  - specs/events.ts
  - specs/pretty.ts
last_verified_commit: 54dee9b
status: active
---

# Testing Contract

## Scope

The project treats behavior specs as the primary source of truth for Typora-compatible editing behavior.

## Producers And Consumers

- `specs/features/*.specs.ts` define seed Markdown, event sequences, and expected pretty output.
- `tests/features/*.test.ts` run spec cases via `runFeatureCases`.
- `tests/roundtrip.test.ts`, `tests/parser.test.ts`, and focused unit tests cover pure parser/serializer and API behavior.
- `specs/pretty.ts` renders a real ProseMirror `EditorView` in happy-dom and converts DOM to a stable text DSL.

## Invariants

- A new feature should add at least one RED spec or unit test before production code.
- Pretty output should represent what the real DOM renders, not duplicate production rendering logic.
- Parser and serializer changes need round-trip coverage for supported Markdown source forms.
- Browser-only APIs must have deterministic fallback tests in happy-dom.

## Common Pitfalls

- If a NodeView changes DOM shape, `specs/pretty.ts` or the feature render case may need an update.
- Async renderers need synchronous observable state for tests, such as `data-*` state attributes or pure helper tests.
