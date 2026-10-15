# Env Execution Checklist

## Read First

- `../../../references/env-core.md`
- `../../../references/policy-core.md`
- `../../../references/env-patterns.md`
- When needed, `../../../references/secrets.md`
- When needed, `../../../references/hub-spoke-architecture.md`
- When needed, `../../../references/github-tokens.md`

## Check Order

1. Separate tracked env from local env (`mise.local.toml`, `mise.<env>.local.toml`).
2. Look for deprecated syntax (`env_file`, `dotenv`, `env_path`, `env.mise.*`, `value` in directive tables).
3. Confirm `redactions` is at the top level.
4. Look for Tera v1 helpers and references to undefined variables.
5. Confirm exactly one Python venv mechanism is chosen.
6. Check that scripts have defaults and work without `mise`.
7. Check `.gitignore` and the tracking state of local config and lockfiles.
8. Align the meaning of `required`, `default`, and `redact` with the real output flow.
9. Hand off to `mise-tasks` when multi-step workflow signals appear.
