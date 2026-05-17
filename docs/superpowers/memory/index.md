---
type: contract
title: repository-memory-index
summary: Entry point for canonical memory covering the Typora-style editor architecture.
tags:
  - repository
  - memory
owned_paths:
  - docs/superpowers/memory/**
entrypoints:
  - README.md
last_verified_commit: 54dee9b
status: active
---

# Repository Memory

## Covered Domains

- Editor core: schema assembly, Markdown parsing, serialization, plugin registration, and public `createEditor()` API.
- Feature registry: one file per Markdown or Typora extension under `src/features/`, mirrored by executable specs under `specs/features/` and tests under `tests/features/`.
- Website harness: native Vite demo and spec catalog under `website/`.

## Primary Docs

- `docs/superpowers/memory/editor-core.md`
- `docs/superpowers/memory/feature-contracts.md`
- `docs/superpowers/memory/testing-contract.md`
- `docs/superpowers/memory/reports/2026-05-17-bootstrap.md`

## Major Gaps

- HTML block and inline HTML policy is intentionally unresolved.
- Reference definition round-trip is partial because markdown-it consumes definitions during parse.
- Theme compatibility with full Typora CSS is a new work area and needs tests before becoming canonical memory.
