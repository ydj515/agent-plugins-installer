# Lock Execution Checklist

## Read First

- `../../../references/lockfile.md`
- `../../../references/version-policy.md`
- For monorepos, `../../../references/monorepo-workspace.md`

## Check Order

1. Are the tools to lock declared in `mise.toml` (move them if they are only in `.tool-versions`)?
2. Is `[settings] lockfile = true` needed, or is creating one once with `mise lock` enough?
3. Does `mise lock --platform` cover every developer, CI, and image platform?
4. Are `mise.lock` and the `.mise/locks` directory (if present) committed?
5. Are `mise.local.lock`, `mise.*.local.lock`, and the `.mise/locks/mise.local` directory ignored?
6. Does CI install with `mise install --locked`?
7. In a monorepo, is the `[monorepo] lockfile` policy explicit?
8. If bumps are automated, do they run with `MISE_SAFE=1` and get a reviewed diff?
9. Are there no `MWL*` diagnostics from the `mise-review` validator?
