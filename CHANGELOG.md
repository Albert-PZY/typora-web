# Changelog

## [0.9.0](https://github.com/Albert-PZY/typora-web/compare/v0.8.0...v0.9.0) (2026-05-28)


### Features

* expand localized Mermaid demo coverage ([e593ea9](https://github.com/Albert-PZY/typora-web/commit/e593ea952f711f24ac91907a10e3e7832f54d831))
* improve Mermaid demo and dark rendering ([#14](https://github.com/Albert-PZY/typora-web/issues/14)) ([527e729](https://github.com/Albert-PZY/typora-web/commit/527e729b8e0bc841ef82501cd31d258223c9cf60))


### Bug Fixes

* balance dark code block highlighting ([#11](https://github.com/Albert-PZY/typora-web/issues/11)) ([5bb8c20](https://github.com/Albert-PZY/typora-web/commit/5bb8c207a917f6b23ac64729f637884adb969861))
* improve dark Mermaid rendering ([2d62ae3](https://github.com/Albert-PZY/typora-web/commit/2d62ae369e07332115875faae5dd7fbb8edd1422))
* remove caution callout support ([#13](https://github.com/Albert-PZY/typora-web/issues/13)) ([c14bd5c](https://github.com/Albert-PZY/typora-web/commit/c14bd5caa1db9a2f0a3508aa845c6f11eb7368b9))


### Performance Improvements

* defer Mermaid diagram rendering ([3e834ed](https://github.com/Albert-PZY/typora-web/commit/3e834ed11dc910f3ecfd21caa962bc1288ce6d2b))

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
