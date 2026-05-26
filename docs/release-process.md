# Release Process

This project is currently unstable and must use beta releases until the project
owner manually promotes a version to production.

Reference:
[GitHub releases documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## Version Format

Use these tag formats:

- Beta milestone releases: `vx.x-beta.x`
- Production releases: `vx.x.x`

Examples:

```text
v0.4-beta.1
v0.4-beta.2
v1.0.0
```

Production tags must only be used after the project owner explicitly decides a
release is production-ready. Until then, all milestone releases are prereleases.

## Package Version Metadata

`package.json` must use valid SemVer. When the Git tag is `v0.4-beta.1`, the
package version should be represented as `0.4.0-beta.1`.

The Git tag keeps the owner-requested format. The package metadata keeps npm and
tooling compatibility.

## When To Release

`main` is protected, so release-worthy work must first merge through a pull
request. After a push lands on `main`, the `Auto Release` workflow decides
whether to prepare a beta release from the Conventional Commit history since
the latest beta tag.

Automatic release rules:

- `feat` creates the next beta minor, for example `v0.7-beta.2` to
  `v0.8-beta.1`.
- `fix` and `perf` create the next beta patch, for example `v0.7-beta.2` to
  `v0.7-beta.3`.
- A `!` marker or `BREAKING CHANGE:` footer creates the next beta major, for
  example `v0.7-beta.2` to `v1.0-beta.1`.
- `docs`, `test`, `ci`, `chore`, `build`, `style`, and `refactor` do not
  publish by themselves.
- Release preparation commits such as `chore(release): prepare v0.8-beta.1` are
  ignored by the auto-release decision so the workflow cannot loop forever.

Manual production releases remain owner-gated. Production tags must only be used
after the project owner explicitly decides the package is production-ready.

## Automated Release Steps

The preferred path is fully automated:

1. Merge a Conventional Commit pull request into `main`.
2. Let the `Auto Release` workflow inspect commits since the latest beta tag.
3. If the change is releasable, it dispatches the `Release` workflow with the
   computed beta tag and npm package version.

The release workflow will:

- Update `package.json` and `pnpm-lock.yaml`.
- Run `pnpm verify`.
- Push a `release/<tag>` branch.
- Open a release pull request with a Conventional Commit title.
- Enable auto-merge for that pull request.
- Let the protected `main` rules run required checks before merge.
- Create and push an annotated tag after the release pull request merges.
- Create a GitHub Release.
- Trigger npm publishing from the pushed `v*` tag.

Documentation-only, test-only, CI-only, and maintenance-only pushes to `main`
do not publish npm packages. npm publishing only runs when a `v*` tag is pushed
after a release pull request has merged.

The `Release` workflow can still be run manually as a fallback:

1. Open `Actions -> Release -> Run workflow`.
2. Enter the Git tag, for example `v0.8-beta.1`.
3. Enter the npm package version, for example `0.8.0-beta.1`.
4. Keep `prerelease` enabled for beta releases.
5. Run the workflow.

The automated release path requires these repository secrets:

- `RELEASE_TOKEN`: a GitHub token allowed to push release branches, enable
  auto-merge, create tags, and create releases.
- `NPM_TOKEN`: an npm token used by the tag-triggered publish workflow.

## Manual Release Fallback

Use these steps only if GitHub Actions is unavailable.

1. Confirm the working tree has no unintended changes:

   ```sh
   git status --short
   ```

2. Run full verification:

   ```sh
   pnpm verify
   git diff --check
   ```

3. Update version metadata if the release changes the package version.

4. Commit the release metadata and release notes:

   ```sh
   git commit -m "chore(release): prepare v0.4-beta.1"
   ```

5. Open a pull request, wait for required checks, and merge it into `main`.

6. Create an annotated tag from the merged `main` commit:

   ```sh
   git tag -a v0.4-beta.1 -m "v0.4-beta.1"
   ```

7. Push the tag:

   ```sh
   git push origin v0.4-beta.1
   ```

8. Create a GitHub prerelease with detailed release notes:

   ```sh
   gh release create v0.4-beta.1 \
     --repo Albert-PZY/typora-web \
     --title "v0.4-beta.1" \
     --notes-file docs/releases/v0.4-beta.1.md \
     --prerelease
   ```

## Release Notes Format

Release notes must be written in Markdown and include:

- Version and release date.
- Target commit or branch.
- Stability status.
- Summary.
- Changes grouped by category, such as `Features`, `Fixes`, `Documentation`,
  `Repository`, `Breaking Changes`, and `Verification`.
- Migration notes when behavior or APIs changed.
- Known limitations.
- Verification commands that were run and their result.

Use this template:

```md
# v0.4-beta.1

Release date: YYYY-MM-DD
Target: main @ <commit>
Stability: Beta prerelease, not production-ready

## Summary

...

## Features

- ...

## Fixes

- ...

## Documentation

- ...

## Repository

- ...

## Breaking Changes

- None.

## Verification

- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm build:lib` passed.
- `git diff --check` passed.

## Known Limitations

- ...
```

## History Rewrite Policy

If the project owner requests removal of unrelated upstream history, rewrite the
branch so only project-owner-relevant commits remain. After a rewrite:

- Delete obsolete upstream tags locally and remotely.
- Force-push with `--force-with-lease`.
- Publish a new beta release describing the rewrite.
- Tell collaborators to reclone or reset their local branch.
