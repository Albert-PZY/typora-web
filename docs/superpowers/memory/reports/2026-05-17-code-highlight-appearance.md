# Memory Update Report: Code Highlighting And Appearance

## Summary

- Scope: CodeMirror fenced-code highlighting, built-in appearance switching, public editor API cleanup.
- Result: done.
- Updated docs: 4.
- Source commits: `204b702`, `5ccb195`, `af1d41e`, `6d496b1`.

## Durable Updates

- `docs/superpowers/memory/feature-contracts.md`: recorded that code-block highlighting must use CodeMirror 5 runmode offsets as ProseMirror inline decorations so the code text remains editable.
- `docs/superpowers/memory/feature-contracts.md`: recorded that unsupported code-fence languages remain plain instead of guessed.
- `docs/superpowers/memory/editor-core.md`: recorded that runtime external CSS theme import is outside the public `createEditor()` controller.
- `docs/superpowers/memory/testing-contract.md`: recorded tests for appearance state modules and intentional public API removals.
- `docs/superpowers/memory/index.md`: replaced the previous full Typora CSS theme-compatibility gap with the current built-in appearance policy.

## Rejected Candidates

- Did not create a separate runbook for theme switching because the behavior is a small website state module with direct unit coverage.
- Did not create a separate decision document because the policy is compact enough for the existing module and contract docs.

## Remaining Gaps

- Inline HTML remains unresolved.
- Reference definition parse preservation remains partial.
