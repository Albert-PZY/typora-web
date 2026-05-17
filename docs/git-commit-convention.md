# Git Commit Convention

This repository strictly follows
[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).
Every commit must be structured, scoped when useful, and limited to one logical
change category.

## Required Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The header is mandatory.

- `type` is a lowercase change category such as `feat`, `fix`, or `docs`.
- `scope` is optional and should name the affected area, for example
  `shortcuts`, `diagrams`, `themes`, `parser`, `release`, or `agents`.
- `description` is a short imperative summary. Do not end it with a period.
- A body may explain motivation, tradeoffs, or details that do not fit in the
  header.
- Footers may carry references such as `Refs: #123` or breaking-change notes.

## Allowed Types

Use these types unless a change clearly needs a more specific Conventional
Commit-compatible type:

| Type | Use for |
|---|---|
| `feat` | User-facing features or new supported behavior |
| `fix` | Bug fixes and behavior corrections |
| `docs` | Documentation-only changes |
| `style` | Formatting-only changes with no behavior impact |
| `refactor` | Internal restructuring with no intended behavior change |
| `perf` | Performance improvements |
| `test` | Test additions or test-only changes |
| `build` | Build system, dependency, or package metadata changes |
| `ci` | CI configuration or automation changes |
| `chore` | Repository maintenance that does not fit another type |
| `revert` | Reverting a previous commit |

## SemVer Meaning

Conventional Commits maps to Semantic Versioning intent:

- `fix` corresponds to a patch-level change.
- `feat` corresponds to a minor-level change.
- Any commit with a breaking-change marker corresponds to a major-level change.

Breaking changes must be marked in one of these ways:

```text
feat(api)!: change editor initialization contract
```

or:

```text
feat(api): change editor initialization contract

BREAKING CHANGE: createEditor now requires an options object.
```

## Splitting Work

Do not bundle unrelated changes into one commit. Split by purpose and scope.

Good split:

```text
fix(shortcuts): keep text after hard breaks
fix(diagrams): hide Mermaid source after successful render
docs(release): document beta release process
ci: remove GitHub Actions workflows
```

Bad bundled commit:

```text
update project
fix stuff
misc changes
```

## Repository Examples

Use focused, descriptive headers:

```text
feat(math): render block formulas with KaTeX
fix(diagrams): keep Mermaid source visible on syntax errors
fix(shortcuts): preserve hard break cursor placement
docs(agents): document Codex repository rules
test(themes): cover built-in appearance switching
chore(release): prepare v0.4-beta.1
```

## Pre-Commit Checklist

Before committing:

- Check `git status --short`.
- Confirm `grok.md`, `.playwright-mcp/`, logs, and other local-only files are
  not staged.
- Stage only paths for the current logical change.
- Run the narrowest relevant tests first.
- Use the required Conventional Commits header.
- If a change is large, split it before committing.

## Enforcement Policy

Every commit in this repository must comply with this document. If a commit
does not comply and has not been pushed yet, rewrite it before continuing. If
multiple unrelated changes were committed together, split them into separate
commits before release.
