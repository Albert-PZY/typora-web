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
`Auto Release` workflow then decides whether to publish:

- `feat` creates the next beta minor.
- `fix` and `perf` create the next beta patch.
- A breaking-change marker creates the next beta major.
- `docs`, `test`, `ci`, `chore`, `build`, `style`, and `refactor` do not publish
  by themselves.

If a release is needed, `Auto Release` dispatches `Release`. `Release` opens a
`release/<tag>` pull request, runs verification, enables auto-merge, creates the
GitHub release after merge, pushes the tag, and lets `Publish npm` publish the
package from that tag.

## Manual Fallback

Use manual release only when automation is unavailable:

1. Run the `Release` workflow from GitHub Actions.
2. Provide a beta tag such as `v0.8-beta.1`.
3. Provide the SemVer package version such as `0.8.0-beta.1`.
4. Keep prerelease enabled.

Do not create production tags unless the project owner explicitly approves a
production-ready release.

## Failure Handling

- If direct push to `main` fails, stop and create a branch plus pull request.
- If required checks fail, fix the branch and let the pull request re-run.
- If auto release calculates an unexpected version, cancel the release pull
  request before merge and fix the release rules in a separate pull request.
- If npm publishing fails after a tag exists, fix the publish workflow or npm
  token and re-run the failed `Publish npm` job. Do not create a replacement tag
  unless the owner approves it.
