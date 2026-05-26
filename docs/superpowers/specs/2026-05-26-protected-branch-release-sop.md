# Protected Branch And Release SOP

Date: 2026-05-26

## Purpose

This SOP prevents blind pushes to the protected `main` branch and documents the
release path for Typora-Web.

## Branch Rules

- `main` is protected.
- Do not push directly to `main`.
- Do not force-push `main`.
- Every change must land through a pull request.
- Required checks must pass before merge:
  - `Verify`
  - `Conventional PR title`
- Pull request titles must follow Conventional Commits.

## Development Flow

1. Update local `main`.

   ```sh
   git checkout main
   git pull --ff-only origin main
   ```

2. Create a focused branch.

   ```sh
   git checkout -b codex/<short-task-name>
   ```

3. Make the change and run the narrowest relevant tests first.

   ```sh
   pnpm test tests/<target>.test.ts
   ```

4. Run broad verification before opening the pull request.

   ```sh
   pnpm verify
   git diff --check
   ```

5. Commit with a Conventional Commit message.

   ```sh
   git add <specific-paths>
   git commit -m "feat(scope): short description"
   ```

6. Push the branch, not `main`.

   ```sh
   git push -u origin codex/<short-task-name>
   ```

7. Open a pull request into `main`.

   ```sh
   gh pr create --base main --head codex/<short-task-name>
   ```

8. Wait for required checks. Fix failures on the same branch.

   ```sh
   gh pr checks --watch
   ```

9. Merge only after checks pass.

   ```sh
   gh pr merge --squash --delete-branch
   ```

## Automatic Release Flow

After a pull request merges, GitHub pushes the squash commit to `main`. The
`Release Please` workflow then decides whether to publish:

- `feat` creates the next minor version.
- `fix` and `perf` create the next patch version.
- A breaking-change marker creates the next major version.
- `docs`, `test`, `ci`, `chore`, `build`, `style`, and `refactor` do not publish
  by themselves.

If a release is needed, Release Please opens or updates a release pull request.
After that pull request merges, Release Please creates the stable `vX.Y.Z`
GitHub Release and tag, then dispatches `Publish npm` from that tag. `Publish
npm` also supports tag-push and manual-dispatch fallbacks and skips versions
that are already published.

## Manual Fallback

Use manual release only when automation is unavailable:

1. Confirm `package.json` already matches the intended stable version.
2. Run the `Manual Release` workflow from GitHub Actions.
3. Provide a stable tag such as `v0.8.0`.
4. Let the workflow create the GitHub Release and dispatch npm publishing.

## Failure Handling

- If direct push to `main` fails, stop and create a branch plus pull request.
- If required checks fail, fix the branch and let the pull request re-run.
- If Release Please calculates an unexpected version, cancel the release pull
  request before merge and fix the release rules in a separate pull request.
- If npm publishing fails after a tag exists, fix the publish workflow or npm
  token and re-run the failed `Publish npm` job. Do not create a replacement tag
  unless the owner approves it.
