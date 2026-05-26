# Release Process

Reference:
[GitHub releases documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## Version Format

Use standard Semantic Versioning for both Git tags and package metadata.

- Git tags must use `vX.Y.Z`, for example `v0.8.0` or `v1.0.0`.
- `package.json` must use the matching npm SemVer version without the leading
  `v`, for example `0.8.0` or `1.0.0`.
- Pre-release tags are not part of the normal release flow.
- Moving compatibility tags such as `v0` and `v0.8` may be updated by
  automation after a stable release is created.

## When To Release

`main` is protected, so release-worthy work must first merge through a pull
request. After a push lands on `main`, Release Please inspects the Conventional
Commit history since the configured baseline or latest release.

Automatic release rules:

- `fix` and `perf` create the next patch version.
- `feat` creates the next minor version.
- A `!` marker or `BREAKING CHANGE:` footer creates the next major version.
- `docs`, `test`, `ci`, `chore`, `build`, `style`, and `refactor` do not publish
  by themselves.

## Automated Release Steps

The preferred path is fully automated:

1. Merge a Conventional Commit pull request into `main`.
2. Let the `Release Please` workflow open or update a release pull request.
3. Review the generated changelog and version bump.
4. Merge the release pull request after required checks pass.
5. Let Release Please create the stable GitHub Release and tag.
6. Let the workflow dispatch `Publish npm` from the release tag.

The release automation will:

- Update `package.json`.
- Update `.release-please-manifest.json`.
- Update `CHANGELOG.md` when Release Please has changes to record.
- Create a stable `vX.Y.Z` Git tag.
- Create a GitHub Release marked as the latest release.
- Move `vX` and `vX.Y` compatibility tags to the release commit.
- Dispatch npm publishing for the stable release tag.

Documentation-only, test-only, CI-only, and maintenance-only pushes to `main`
do not publish npm packages. npm publishing only runs after a stable `vX.Y.Z`
release tag exists. The `Publish npm` workflow also keeps a tag-push trigger and
a manual dispatch trigger as fallbacks, and it skips versions that are already
published.

The automated release path requires these repository secrets:

- `RELEASE_TOKEN`: a GitHub token allowed to create release pull requests,
  create tags, create releases, and dispatch workflows.
- `NPM_TOKEN`: an npm token used by the npm publish workflow.

## Manual Release Fallback

Use these steps only if Release Please is unavailable.

1. Confirm the working tree has no unintended changes:

   ```sh
   git status --short
   ```

2. Run full verification:

   ```sh
   pnpm verify
   git diff --check
   ```

3. Confirm `package.json` already matches the intended stable release version.

4. Create an annotated tag from the verified `main` commit:

   ```sh
   git tag -a v0.8.0 -m "v0.8.0"
   ```

5. Push the tag:

   ```sh
   git push origin v0.8.0
   ```

6. Create a stable GitHub Release:

   ```sh
   gh release create v0.8.0 \
     --repo Albert-PZY/typora-web \
     --title "v0.8.0" \
     --generate-notes \
     --latest
   ```

7. Dispatch npm publishing if the tag push did not already trigger it:

   ```sh
   gh workflow run publish-npm.yml --ref v0.8.0
   ```

The `Manual Release` workflow can also create a stable release when the package
version already matches the requested tag:

```text
Actions -> Manual Release -> Run workflow -> tag=v0.8.0
```

## Release Notes Format

Release Please generates the changelog and GitHub Release notes from
Conventional Commits. Manual notes should keep the same grouping style and
include:

- Version and release date.
- Target commit or branch.
- Summary.
- Changes grouped by category, such as `Features`, `Bug Fixes`,
  `Performance`, `Documentation`, `Repository`, and `Breaking Changes`.
- Migration notes when behavior or APIs changed.
- Known limitations.
- Verification commands that were run and their result.

Use this template for manual notes:

```md
# v0.8.0

Release date: YYYY-MM-DD
Target: main @ <commit>

## Summary

...

## Features

- ...

## Bug Fixes

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
- Publish a new stable release describing the rewrite.
- Tell collaborators to reclone or reset their local branch.
