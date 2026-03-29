# Changelog

All notable changes to this project will be documented in this file.

This changelog is based on the versioned states visible in this repository's git history.

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
