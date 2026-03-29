# agent-plugins-installer

`agent-plugins-installer` is an npm CLI that unifies plugin and extension installation flows for Codex, Claude Code, and Gemini CLI.

The core structure is similar to `agent-skills-installer`: it keeps a shared source bundle first, then adapts that bundle into each target's required layout at install time.

- Shared source: `plugins/<plugin-id>/`
- Target overlay: `plugins/<plugin-id>/targets/<codex|claude|gemini>/`
- Installer role: reads a shared integration bundle, lays out a target-specific local bundle, and runs the installation command for that agent

The bundled catalog currently includes these integrations:

- `github`
- `vercel`

Supported targets:

- Codex: local plugin copy plus marketplace provisioning
- Claude Code: local plugin copy plus local marketplace provisioning
- Gemini CLI: local extension bundle copy plus `gemini extensions install/enable`
  Note: Gemini uses extensions, not plugins.

## Quick Start

Interactive install:

```bash
npx agent-plugins-installer
```

Direct install

```bash
npx agent-plugins-installer install codex --scope project --plugins github
npx agent-plugins-installer install claude --scope user --plugins github,vercel
npx agent-plugins-installer install gemini --scope user --plugins vercel
```

List installed and available integrations:

```bash
npx agent-plugins-installer list all --scope user
```

Remove integrations:

```bash
npx agent-plugins-installer remove codex --scope project --plugins github
```

Update integrations:

```bash
npx agent-plugins-installer update codex --scope project --plugins github
```

## Target Behavior

### Codex

- Copies the plugin source into `.codex/plugins/<plugin-id>`.
- Uses `~/.agents/plugins/marketplace.json` for `user` scope and `<cwd>/.agents/plugins/marketplace.json` for `project` scope.
- After installation, you may need to restart Codex and install or enable the plugin from Plugin Directory.

### Claude Code

- Copies the shared integration source into `.claude/plugins/<plugin-id>`.
- Creates a local marketplace manifest at `.claude/.claude-plugin/marketplace.json`.
- Runs `claude plugin marketplace add <local-marketplace-path> --scope <scope>`, then `claude plugin install <plugin>@agent-plugins-installer --scope <scope>`.
- Records install state in `.claude/.agent-plugins-installer-state.json`.
- After installation, you may need to run `/reload-plugins` or restart Claude Code.

### Gemini CLI

- Gemini uses extensions, not plugins.
- In `user` scope, copies the shared integration source into `~/.gemini/extensions/<extension-id>` and runs `gemini extensions install <local-extension-path> --consent`.
- In `project` scope, also copies the shared integration source into `~/.gemini/extensions/<extension-id>`, then runs `gemini extensions enable <name> --scope workspace` for the current workspace.
- In `project` scope, the installed extension bundle is still visible under `~/.gemini/extensions/<extension-id>`, not under `<cwd>/.gemini`.
- `<cwd>/.gemini` is used for workspace-level state, not as the primary extension bundle location.
- Records install state in `~/.gemini/.agent-plugins-installer-state.json` for `user` scope and `<cwd>/.gemini/.agent-plugins-installer-state.json` for `project` scope.

## Development

```bash
npm test
mise run verify
```
