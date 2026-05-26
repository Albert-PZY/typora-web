# Changelog

## 0.8.0 (2026-05-27)

This release establishes the stable SemVer release baseline for Typora-Web.

### Added

- Restored editor polish and automation workflow foundations, including the
  editor shell, sidebar, tool buttons, and initial release pipeline. #1
- Expanded localized demo content so the home example covers supported
  Markdown, Typora extensions, math, Mermaid, HTML, images, and callouts. #4
- Improved HTML block and HTML image editing so source edits keep a live preview
  while bare URL autolinks stop at the correct boundary. #5

### Changed

- Updated GitHub Actions runtimes across CI, Pages, Release, and npm publish
  workflows. #2
- Aligned release automation with protected-branch rules and PR-only changes to
  `main`. #3
- Simplified auto-release guards before replacing the beta flow. #6
- Dispatched npm publishing from GitHub Releases and skipped versions that are
  already published. #8
- Replaced beta milestone rules with stable SemVer and Release Please, then
  split the README into English and Chinese documents. #9

### Release Notes

- Current GitHub Release type: stable release, marked as `Latest`.
- Old beta tags were deleted; old prerelease records remain only as historical
  GitHub Release entries.
- npm publishing is blocked because the public `typora-web` package name
  already belongs to another npm owner.
