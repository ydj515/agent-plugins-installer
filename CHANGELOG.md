# Changelog

All notable changes to this project will be documented in this file.

This changelog is based on the versioned states visible in this repository's git history.

## [0.1.9]

### Highlights

- added an `architecture-diagram` plugin for standalone HTML architecture diagrams and resource allocation plans
- refreshed `mise-workflows` against the mise 2026.10 documentation and added `mise-lock` and `mise-ci` skills
- translated the `architecture-diagram` and `mise-workflows` skill content to English

### Added

- `architecture-diagram` plugin with Codex, Claude, and Gemini target manifests and repo marketplace entries
- `mise-lock` and `mise-ci` skills in `mise-workflows`, with lockfile, CI integration, and secrets references
- a task definition rule that requires `description`, `usage` with `about`, and `run` for every mise task
- a tool execution rule that avoids `mise exec` when a task uses the `[tools]` version
- validator rules for deprecated mise syntax, the task definition rule, npm-style version ranges, and lockfile settings
- regression tests for the `architecture-diagram` install flow and the `mise-workflows` validator and starter examples

### Changed

- bumped `mise-workflows` to `0.2.0` and updated its Codex, Claude, and Gemini metadata for eight skills
- updated `mise-workflows` guidance for backend priority, version request syntax, `minimum_release_age`, Tera v2 templates, `python.uv_venv_auto`, monorepo `//path:task` names, task `skip_if`, `timeout`, and `sources`/`outputs`
- updated starter profile examples to Python `3.14`, uv `0.13`, Java `zulu-25`, and Gradle `9.8`
- renamed skill-local `mise-workflows` checklists so they no longer collide with shared reference file names
- pinned the repository's mise Node version to `24.19.0` and aligned the repository's own mise tasks with the task rules
- removed an absolute path from `docs/IMPLEMENTATION_PLAN.md`

### Fixed

- fixed invalid TOML and `usage` syntax in `mise-workflows` examples (unquoted task names with `:` and `choices=[...]`)
- fixed relative reference paths in skill-local `mise-workflows` checklists

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
- updated the full npm test suite to run with Node's test runner concurrency set to `1` so generated direct bundles are not read while another test file is exercising CLI install flows
- handled closed stdin pipes in `runCommand` so commands that accept optional stdin but exit early are still judged by their process exit code
- updated CI and release tarball smoke tests to use a temporary `codex` shim so package verification does not require the Codex CLI on GitHub-hosted runners

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
