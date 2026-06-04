# agent-plugins-installer

`agent-plugins-installer` is an npm CLI that unifies plugin and extension installation flows for Codex, Claude Code, and Gemini CLI.

The core structure is similar to `agent-skills-installer`: it keeps a shared source bundle first, then adapts that bundle into each target's required layout at install time.

- Shared source: `plugins/<plugin-id>/`
- Target overlay: `plugins/<plugin-id>/targets/<codex|claude|gemini>/`
- Installer role: reads a shared integration bundle, lays out a target-specific local bundle, and runs the installation command for that agent

The bundled catalog currently includes these integrations:

- `github`
- `vercel`
- `superpowers`
- `mise-workflows`
- `spring-thymeleaf-a11y`

Supported targets:

- Codex: local plugin copy plus marketplace provisioning
- Claude Code: local plugin copy plus local marketplace provisioning
- Gemini CLI: local extension bundle copy plus `gemini extensions install/enable`
  Note: Gemini uses extensions, not plugins.

## Repo Marketplace Manifests

This repository now includes repo marketplace manifests for direct discovery:

- Codex: `.agents/plugins/marketplace.json`
- Claude Code: `.claude-plugin/marketplace.json`

The plugin roots under `plugins/<plugin-id>/` remain the shared source bundle. The target manifests under `plugins/<plugin-id>/targets/<agent>/` are the source of truth for agent-specific entrypoints.

Direct marketplace and extension installs use generated self-contained bundles under `.generated/direct/<agent>/<plugin-id>`, built by merging:

- shared source: `plugins/<plugin-id>/`
- target overlay: `plugins/<plugin-id>/targets/<agent>/`

Generate or refresh those bundles with:

```bash
npm run sync:direct-bundles
```

`npm test` and `npm run test:real-cli` run this sync step automatically before verification.

This is separate from the installer's generated local manifests:

- Codex project or user installs still generate `.agents/plugins/marketplace.json` in the target workspace or home directory, and those generated entries point at `.codex/plugins/<plugin-id>`.
- Claude installs still generate `.claude/.claude-plugin/marketplace.json` in the target workspace or home directory, and those generated entries point at `.claude/plugins/<plugin-id>`.

## Quick Start

Interactive install:

```bash
npx agent-plugins-installer
```

Direct install

```bash
npx agent-plugins-installer install codex --scope workspace --plugins github
npx agent-plugins-installer install claude --scope user --plugins github,vercel
npx agent-plugins-installer install gemini --scope user --plugins vercel
npx agent-plugins-installer install codex --scope workspace --plugins mise-workflows
npx agent-plugins-installer install codex --scope workspace --plugins spring-thymeleaf-a11y
```

List installed and available integrations:

```bash
npx agent-plugins-installer list all --scope user
```

Remove integrations:

```bash
npx agent-plugins-installer remove codex --scope workspace --plugins github
```

Update integrations:

```bash
npx agent-plugins-installer update codex --scope workspace --plugins github
```

## Target Behavior

### Codex

- Copies the plugin source into `.codex/plugins/<plugin-id>`.
- Uses `~/.agents/plugins/marketplace.json` for `user` scope and `<cwd>/.agents/plugins/marketplace.json` for `project` scope.
- `workspace` is accepted as an alias for `project`.
- Runs `codex plugin marketplace add <marketplace-root>`, `codex plugin add <plugin>@agent-plugins-installer`, and `codex plugin list --marketplace agent-plugins-installer`.
- Codex currently records installed plugin cache and enabled state through the Codex CLI configuration flow. Project `.codex/config.toml` is only a trusted-project config layer, so this installer does not rely on it as the sole plugin activation mechanism.
- After installation, restart Codex or start a new thread so newly installed skills are loaded.

### Claude Code

- Copies the shared integration source into `.claude/plugins/<plugin-id>`.
- Creates a local marketplace manifest at `.claude/.claude-plugin/marketplace.json`.
- Runs `claude plugin marketplace add <local-marketplace-path> --scope <scope>`, then `claude plugin install <plugin>@agent-plugins-installer --scope <scope>`.
- Records install state in `.claude/.agent-plugins-installer-state.json`.
- After installation, you may need to run `/reload-plugins` or restart Claude Code.

### Gemini CLI

- Gemini uses extensions, not plugins.
- For direct repo-based extension validation, use the generated bundles under `.generated/direct/gemini/<plugin-id>`.
- In `user` scope, copies the shared integration source into `~/.gemini/extensions/<extension-id>` and runs `gemini extensions install <local-extension-path> --consent`.
- In `project` scope, copies the shared integration source into `<cwd>/.gemini/extensions/<extension-id>`, then runs `gemini extensions enable <name> --scope workspace` for the current workspace.
- In `project` scope, the installed extension bundle is visible under `<cwd>/.gemini/extensions/<extension-id>`.
- Records install state in `~/.gemini/.agent-plugins-installer-state.json` for `user` scope and `<cwd>/.gemini/.agent-plugins-installer-state.json` for `project` scope.

## Development

```bash
npm test
mise run verify
```
