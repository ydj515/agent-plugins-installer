# Changelog

All notable changes to this project will be documented in this file.

This project follows a simple release-oriented changelog format.

## [0.1.0]

### Highlights

- safer per-target installs with atomic rollback on failure
- broader regression coverage for installer edge cases and target-specific layout handling
- v2 skill management commands: `install --skills`, `list`, `remove`, and `update`
- interactive search and filter UX for larger catalogs
- shared bundled example skills adapted into target-specific Codex, Claude Code, and Gemini CLI layouts
- stronger release verification with Node `20`/`22`/`24` CI, local `mise` test matrix support, and packed tarball `npx` smoke tests

### Added

- public npm package scaffold for `agent-skills-installer`
- direct install CLI for `codex`, `claude`, `gemini`, and `all`
- interactive install wizard with target-by-target skill selection
- bundled example skills: `gh-address-comments`, `gh-fix-ci`, `playwright`
- target-specific layout adaptation from one shared packaged skill source
- catalog `schemaVersion=2` with `tags`, `groups`, `hidden`, and `deprecated` metadata support
- install path resolution for Codex, Claude Code, and Gemini CLI
- ownership markers, lock files, stale temp cleanup, and staged installs
- `--scope`, `--cwd`, `--dry-run`, and `--force` support
- `install --skills`, `list`, `remove`, and `update`
- interactive wizard search and filter shortcuts for larger catalogs
- regression coverage for install edge cases and target-specific layout handling
- `mise`-based local development workflow with multi-version Node test tasks
- GitHub Actions verification on Node `20`, `22`, and `24`
- packed tarball `npx` smoke test coverage
- public README and MIT license

### Fixed

- atomic rollback when a target install fails part-way through
- failure summaries and single-target exit codes now reflect actual install results

### Notes

- `v0.1.0` now covers the bundled example catalog flow and the first round of v2 catalog and management features.
- larger bundled catalogs and richer metadata presentation remain planned for a later release.
