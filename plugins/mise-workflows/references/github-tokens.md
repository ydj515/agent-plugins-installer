# GitHub Tokens

## Purpose

This document separates two token problems:

1. Injecting per-directory tokens for project tools (`gh`, release scripts)
2. The token mise itself uses to avoid GitHub API rate limits while installing tools

## Principles

- Point `GH_TOKEN` and `GITHUB_TOKEN` at the same token source where possible.
- Never put raw tokens in a tracked `mise.toml`.
- Choose one clear source: a token file, a secret manager, or a local `.env`.

## For Project Tools: Per-Directory Tokens

When accounts must be separated inside one repository, compute the token file path from `config_root` or `env.HOME`.

```toml
[env]
GH_TOKEN = { value = "{{ read_file(path=(config_root ~ \"/.secrets/gh-token\")) | trim }}", redact = true }
GITHUB_TOKEN = { value = "{{ env.GH_TOKEN }}", redact = true }
```

When the token file lives in a shared home directory:

```toml
[env]
GH_TOKEN = { value = "{{ read_file(path=(env.HOME ~ \"/.config/tokens/work-gh-token\")) | trim }}", redact = true }
GITHUB_TOKEN = { value = "{{ env.GH_TOKEN }}", redact = true }
```

- Add `.secrets/` to `.gitignore`.
- Tera v2 fails on undefined values. If the token file may be missing in some environments, keep this pattern in `mise.local.toml`.

## The Token mise Itself Uses

mise calls the GitHub API when it installs `github:` and `aqua:` tools. This token is separate from the project tokens above.

- Environment variables: `MISE_GITHUB_TOKEN` comes first; otherwise mise reads `GITHUB_TOKEN`. mise does not read `GH_TOKEN` itself.
- Token file: put per-host tokens in `~/.config/mise/github_tokens.toml` with permissions `600`.
- CLI login: mise reads the token `gh` stores in `hosts.yml`. If `gh` keeps it in the system keyring, set `credential_command = 'gh auth token --hostname "$MISE_CREDENTIAL_HOST"'` in global config.
- `credential_command` is global-only, so a project config cannot choose an arbitrary command.
- In CI, pass the workflow token as `MISE_GITHUB_TOKEN`. `jdx/mise-action` passes the token only to its install step and does not export it to later steps.

## Why Both Are Needed

- `GH_TOKEN`: the `gh` CLI, validation tasks, some shell scripts
- `GITHUB_TOKEN`: npm scripts, release tooling, GitHub-oriented build tools, mise installs (fallback)

Setting only one can break authentication in some toolchains.

## Verification

- `gh auth status`
- Check in release tasks that the current account matches the repository owner
- Record which account a project needs in its README or ADR

## Caveats

- SSH ControlMaster or session caches can delay an account switch.
- A long-lived shell can keep using an old value after the token changes.
- Non-interactive jobs may skip shell activation, so `.env` files or secret manager integration may fit better.
