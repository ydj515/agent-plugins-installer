# Changelog

All notable changes to this project will be documented in this file.

This changelog is based on the versioned states visible in this repository's git history.

## [0.1.8]

### Highlights

- added a `web-a11y` remediation skill for fixing actionable axe accessibility report findings
- added a color-contrast safety gate that requires explicit user confirmation before changing contrast-related styles
- clarified `web-a11y` configuration path behavior in English

### Added

- `a11y-fix-guide` skill for applying focused fixes from Playwright/axe-core JSON or Markdown audit reports
- axe remediation reference patterns for common findings such as `button-name`, `link-name`, `select-name`, `page-has-heading-one`, `landmark-one-main`, `region`, `bypass`, labels, ARIA, keyboard, focus, and table issues
- Codex, Claude, and Gemini plugin metadata updates that describe the `web-a11y` bundle as both an audit and remediation workflow

### Changed

- updated `web-a11y` guidance to treat axe selectors as rendered DOM locations while mapping them back to source code before editing
- documented that `color-contrast` findings must be summarized and approved by the user before any color token, CSS variable, theme value, overlay, gradient, or component color prop is changed
- translated the `config-examples.md` path principles section into English

## [0.1.7]

### Highlights

- removed duplicated root agent manifests from plugin source directories
- made `targets/<agent>` overlays the source of truth for direct bundle generation
- added generated direct-bundle syncing for repo marketplace and real CLI verification

### Added

- `scripts/sync-direct-bundles.mjs` to build self-contained direct-install bundles under `.generated/direct`
- `test/real-cli-e2e.test.js` for real Codex, Claude, and Gemini install verification
- `sync:direct-bundles` npm script for refreshing generated direct bundles
- `test:real-cli` npm script for running only the real CLI integration test suite

### Changed

- updated repo-level Codex and Claude marketplace manifests to point at generated bundles under `.generated/direct`
- updated README documentation to distinguish shared source bundles, target overlays, generated direct bundles, and installer-generated local outputs

## [0.1.6]

### Highlights

- clarified `mise-workflows` skill guidance by replacing ambiguous reference instructions with explicit document paths
- fixed the Codex `mise-workflows` manifest so packaged skill and asset paths resolve from the installed plugin archive

### Changed

- updated `mise-env`, `mise-tasks`, and `mise-review` to point directly to the relevant root references for monorepo, GitHub auth, env, task, and release guidance
- corrected `plugins/mise-workflows/targets/codex/.codex-plugin/plugin.json` to use archive-local `./skills/` and `./assets/...` paths

## [0.1.5]

### Highlights

- added the bundled `mise-workflows` integration for Codex, Claude Code, and Gemini CLI
- updated release metadata and documentation for the new `mise-workflows` catalog entry

### Added

- `mise-workflows` catalog entry with shared metadata, tags, and workflow-oriented grouping

### Changed

- updated the README bundled integration list and direct install examples to include `mise-workflows`
- bumped the package version metadata to `0.1.5`

## [0.1.4]

### Highlights

- added the bundled `superpowers` integration for Codex, Claude Code, and Gemini CLI
- aligned `superpowers` with the shared integration-bundle layout used by the installer
- extended install regression coverage to verify multi-target installation of `superpowers`

### Added

- `superpowers` catalog entry with shared metadata, tags, and workflow-oriented grouping
- target-specific `superpowers` manifests for Codex, Claude Code, and Gemini CLI
- Gemini extension context file for the bundled `superpowers` workflow guidance
- install regression test that verifies `superpowers` is installed across Codex, Claude Code, and Gemini CLI in project scope

### Changed

- moved the `superpowers` Codex plugin manifest into the standard `targets/codex` overlay structure used by packaged integrations
- updated the README bundled integration list to include `superpowers`

## [0.1.3]

### Highlights

- switched npm release automation from token-based publishing to npm trusted publishing
- added package metadata for repository, homepage, and issue tracking to improve npm package provenance and discoverability
- normalized publish-time CLI metadata for the `agent-plugins-installer` binary

### Changed

- updated the GitHub Actions release workflow to publish with npm trusted publishing on Node `24`
- removed the publish-time dependency on `NPM_TOKEN` from the release workflow
- added `repository`, `homepage`, and `bugs` metadata to `package.json`
- simplified the published CLI bin path from `./src/cli.js` to `src/cli.js`

### Notes

- this release focuses on npm publishing hardening rather than installer feature changes

## [0.1.2]

### Highlights

- added GitHub Actions CI and release verification for the packaged CLI
- fixed tarball smoke tests to validate the real `agent-plugins-installer` package and Codex plugin output
- reduced npm package contents with an explicit `.npmignore` and a tighter published file list

### Added

- CI workflow running verification across Node `20`, `22`, and `24`
- release workflow that validates the release tag, runs tests, builds a tarball, and smoke-tests the package before publishing
- `.npmignore` to exclude repository-only assets such as `.github`, `test`, local logs, and development metadata from published tarballs

### Changed

- updated the smoke test commands from the old `agent-skills-installer` naming and skill-path assertions to the actual `agent-plugins-installer` Codex plugin layout
- added `README.md` to the npm package contents
- removed `docs` from the npm `files` allowlist so published tarballs stay smaller and more focused

### Notes

- `0.1.1` was used as a test version before the `0.1.2` packaging and CI cleanup release

## [0.1.1]

### Notes

- this version was used for testing

## [0.1.0]

### Highlights

- initial public release of `agent-plugins-installer`
- introduced a shared integration-bundle model with target-specific overlays for Codex, Claude Code, and Gemini CLI
- shipped bundled `github` and `vercel` integrations with target-specific manifests and assets

### Added

- npm CLI entrypoint for interactive installs and direct `install`, `list`, `remove`, and `update` commands
- catalog-driven integration resolution with support for `--plugins`, `--tag`, `--group`, `--scope`, `--cwd`, `--dry-run`, and `--force`
- atomic install and rollback flow with install markers, lock files, temp cleanup, and managed state tracking
- Codex plugin installation with local marketplace provisioning
- Claude Code plugin installation with local marketplace provisioning and install-state persistence
- Gemini extension installation and workspace enablement with scope-specific state tracking
- bundled GitHub integration containing plugin manifests, target overlays, and packaged skills such as `gh-address-comments`, `gh-fix-ci`, `github`, and `yeet`
- bundled Vercel integration containing commands, agents, skills, target overlays, and website assets
- automated regression tests for install, update, remove, and list flows across supported targets
- project documentation including the README and bundled plugin authoring references under `docs/`
- local `mise` tasks for running tests, packing the tarball, and end-to-end verification

### Notes

- `0.1.0` establishes the initial multi-target plugin and extension installer with the first bundled integration catalog
