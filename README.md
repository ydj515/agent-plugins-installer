# agent-plugins-installer

[![CI](https://github.com/ydj515/agent-plugins-installer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ydj515/agent-plugins-installer/actions/workflows/ci.yml)
[![Release Publish Package](https://github.com/ydj515/agent-plugins-installer/actions/workflows/release-publish.yml/badge.svg?event=release)](https://github.com/ydj515/agent-plugins-installer/actions/workflows/release-publish.yml)
[![Sync Development Standards](https://github.com/ydj515/agent-plugins-installer/actions/workflows/sync-dev-standards.yml/badge.svg?branch=main)](https://github.com/ydj515/agent-plugins-installer/actions/workflows/sync-dev-standards.yml)
[![npm version](https://img.shields.io/npm/v/agent-plugins-installer.svg?logo=npm)](https://www.npmjs.com/package/agent-plugins-installer)
[![Node.js](https://img.shields.io/badge/Node.js-24.19.0%20(%3E%3D20.0.0)-339933?logo=nodedotjs&logoColor=white)](./mise.toml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

An npm CLI that unifies bundled plugin and extension installation workflows for Codex, Claude Code, and Gemini CLI.
It maintains a single shared integration source bundle (`plugins/<plugin-id>/`) with target-specific overlays, provisioning each agent's required local marketplace or extension layout automatically at install time.
Run it directly via `npx` using either the interactive terminal wizard or non-interactive CLI commands without cloning the repository.

**Tech Stack:** Node.js (ESM, `>=20.0.0`) · npm CLI · `node:test` · mise · GitHub Actions

## Highlights

- **Unified Multi-Agent Provisioning:** Adapts one shared integration bundle into Codex plugins, Claude Code plugins, and Gemini CLI extensions
- **Interactive Wizard & Direct CLI:** Supports a zero-argument interactive terminal wizard alongside scriptable `install`, `list`, `update`, and `remove` commands with `--plugins`, `--tag`, `--group`, and `--dry-run`
- **Scoped & Tracked State:** Separates `user` and `project` (`workspace`) scopes while tracking managed installations for safe updates and removals

## Bundled Catalog

Default integrations defined in [`catalog.json`](./catalog.json):

| ID | Description |
| --- | --- |
| `github` | GitHub pull request, issue, and CI workflow integration bundle |
| `vercel` | Vercel deployment and project configuration integration bundle |
| `superpowers` | Agent workflow bundle for planning, TDD, debugging, and collaboration |
| `mise-workflows` | `mise.toml` authoring, review, lockfile, and CI standardization bundle |
| `web-a11y` | Playwright and axe-core web accessibility audit and remediation bundle |
| `architecture-diagram` | Standalone HTML architecture diagram and resource allocation generator |
| `hiring-analyzer` | Evidence-based seven-perspective resume review and fact-preserving rewrite bundle |

## Requirements

- **CLI Usage:** Node.js `>=20.0.0` and the target agent CLI (`codex`, `claude`, or `gemini`)
- **Local Development:** [mise](https://mise.jdx.dev/) — Node.js (`24.19.0`) is pinned in [`mise.toml`](./mise.toml) and installed by `mise`.

## Quick Start

### Install via `npx`

```bash
# Launch the interactive installation wizard
npx agent-plugins-installer

# Direct installation by target and scope
npx agent-plugins-installer install codex --scope workspace --plugins github,mise-workflows
npx agent-plugins-installer install claude --scope user --plugins github,vercel
npx agent-plugins-installer install gemini --scope user --plugins vercel

# Inspect, update, or remove installed integrations
npx agent-plugins-installer list all --scope user
npx agent-plugins-installer update codex --scope workspace --plugins github
npx agent-plugins-installer remove codex --scope workspace --plugins github
```

### Local Development

```bash
mise trust       # One-time: review and trust mise.toml
mise install     # Install pinned Node.js (24.19.0)
mise run verify  # Run tests, dry-run tarball pack, and npx smoke test
```

Target-specific provisioning paths, repository marketplace manifests (`.generated/direct/`), and release workflows are documented in the [Usage & Architecture Guide](./docs/GUIDE.md).

## Key Commands

| Command | Description |
| --- | --- |
| `mise run start` | Run the CLI locally (`node src/cli.js`) |
| `mise run test` | Sync direct bundles and run the automated test suite (`npm test`) |
| `mise run test-matrix` | Run the test suite across Node.js `20`, `22`, and `24` |
| `mise run pack` | Dry-run the publishable npm tarball (`npm pack --dry-run`) |
| `mise run smoke` | Pack the tarball and smoke-test installation through `npx` |
| `mise run verify` | Run `test` + `pack` + `smoke` verification gate |

Run `mise tasks` to see the full task list.

## Documentation

- [Usage & Architecture Guide](./docs/GUIDE.md)
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- [Changelog](./CHANGELOG.md)

## Contributing

Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting changes.
