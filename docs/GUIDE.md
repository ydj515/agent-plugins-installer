# Guide

Detailed usage, target-specific behavior, repository marketplace manifests, local development, and publishing reference for `agent-plugins-installer`.

## Architecture Overview

`agent-plugins-installer` keeps a single shared source bundle per integration, then adapts that bundle into each target CLI's required directory layout and manifest format at install time.

- **Shared source:** [`plugins/<plugin-id>/`](../plugins)
- **Target overlay:** `plugins/<plugin-id>/targets/<codex|claude|gemini>/`
- **Installer role:** Merges the shared integration bundle with the target overlay, stages a target-specific local bundle, and executes the registration command for that agent CLI.

Supported targets:

- **Codex:** Local plugin copy plus marketplace (`marketplace.json`) provisioning
- **Claude Code:** Local plugin copy plus local marketplace provisioning
- **Gemini CLI:** Local extension bundle copy plus `gemini extensions install/enable` (Gemini uses extensions rather than plugins)

## CLI Usage

### Interactive Mode

Run without arguments in a TTY terminal to launch the interactive setup wizard:

```bash
npx agent-plugins-installer
```

### Direct CLI

```bash
npx agent-plugins-installer install <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] [--force] [--plugins <a,b>] [--tag <tag>] [--group <group>]
npx agent-plugins-installer list <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--plugins <a,b>] [--tag <tag>] [--group <group>]
npx agent-plugins-installer remove <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] (--plugins <a,b> | --tag <tag> | --group <group>)
npx agent-plugins-installer update <codex|claude|gemini|all> [--scope user|workspace|project] [--cwd <path>] [--dry-run] [--plugins <a,b>] [--tag <tag>] [--group <group>]
```

Key options:

- `--scope`: `user` (default) or `project` (`workspace` is accepted as an alias)
- `--cwd`: Target project directory when using `project`/`workspace` scope
- `--plugins`: Comma-separated list of integration IDs to install, list, remove, or update
- `--tag` / `--group`: Filter integrations by [`catalog.json`](../catalog.json) metadata (cannot be combined with `--plugins`)
- `--dry-run`: Preview planned actions without modifying files or invoking agent CLIs
- `--force`: Overwrite existing managed directories (`install` only)

## Target Behavior

### Codex

- Copies the plugin source into `.codex/plugins/<plugin-id>`.
- Uses `~/.agents/plugins/marketplace.json` for `user` scope and `<cwd>/.agents/plugins/marketplace.json` for `project` (`workspace`) scope.
- Runs:
  1. `codex plugin marketplace add <marketplace-root>`
  2. `codex plugin add <plugin>@agent-plugins-installer`
  3. `codex plugin list --marketplace agent-plugins-installer`
- Codex records installed plugin cache and enabled state through the Codex CLI configuration flow. Project `.codex/config.toml` is treated only as a trusted-project config layer rather than the sole activation mechanism.
- After installation, restart Codex or start a new thread so newly installed skills are loaded.

### Claude Code

- Copies the shared integration source into `.claude/plugins/<plugin-id>`.
- Creates a local marketplace manifest at `.claude/.claude-plugin/marketplace.json`.
- Runs:
  1. `claude plugin marketplace add <local-marketplace-path> --scope <scope>`
  2. `claude plugin install <plugin>@agent-plugins-installer --scope <scope>`
- Records install state in `.claude/.agent-plugins-installer-state.json`.
- After installation, run `/reload-plugins` or restart Claude Code.

### Gemini CLI

- Gemini uses extensions rather than plugins.
- In `user` scope:
  - Copies the integration bundle into `~/.gemini/extensions/<extension-id>` and runs `gemini extensions install <local-extension-path> --consent`.
  - Records install state in `~/.gemini/.agent-plugins-installer-state.json`.
- In `project` (`workspace`) scope:
  - Copies the integration bundle into `<cwd>/.gemini/extensions/<extension-id>` and runs `gemini extensions enable <name> --scope workspace`.
  - Records install state in `<cwd>/.gemini/.agent-plugins-installer-state.json`.

## Repository Marketplace Manifests

In addition to the CLI installer, this repository includes root marketplace manifests for direct repository discovery:

- **Codex:** [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json)
- **Claude Code:** [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json)

Direct marketplace and extension installs use generated self-contained bundles under `.generated/direct/<agent>/<plugin-id>`, built by merging `plugins/<plugin-id>/` with `plugins/<plugin-id>/targets/<agent>/`.

Generate or refresh those bundles with:

```bash
npm run sync:direct-bundles
```

`npm test` and `npm run test:real-cli` run this synchronization step automatically before verification.

## Local Development & Verification

Node.js (`24.19.0`) and development tasks are configured in [`mise.toml`](../mise.toml):

```bash
mise trust
mise install
mise run verify
```

Verification commands:

- `npm test` / `mise run test`: Sync direct bundles and run the automated test suite
- `mise run test-matrix`: Run the test suite across Node.js `20`, `22`, and `24`
- `mise run pack`: Dry-run the publishable npm tarball (`npm pack --dry-run`)
- `mise run smoke`: Pack the tarball and smoke-test installation through `npx`
- `npm run test:real-cli`: Run end-to-end verification against installed agent CLIs

## CI & Release Publishing

- **CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):** Runs on push, pull request, and manual dispatch across Node.js `20`, `22`, and `24`, verifying `npm test`, `npm pack --dry-run`, and tarball `npx` smoke installation.
- **Release ([`.github/workflows/release-publish.yml`](../.github/workflows/release-publish.yml)):** Triggered when a GitHub Release tag matching `v<package.json#version>` is published. Re-runs the full Node.js verification matrix before publishing to npm with trusted publishing (`id-token: write`).
