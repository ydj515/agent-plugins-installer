# CI Execution Checklist

## Read First

- `../../../references/ci-integration.md`
- `../../../references/lockfile.md`
- When needed, `../../../references/github-tokens.md`
- When needed, `../../../references/secrets.md`

## Check Order

1. Are workflow files free of hardcoded tool versions?
2. Does installation use `mise install --locked` (or `jdx/mise-action` when `mise.lock` exists)?
3. Does the job call a single task such as `mise run ci`, with the steps defined in `[tasks]`?
4. Are caches saved only from trusted refs, and with a lockfile, is the download store (`~/.cache/mise/downloads-cas`) cached?
5. Do fork PR and bot jobs read config with `MISE_SAFE=1`?
6. Do later steps that call the GitHub API receive a token?
7. Does the Dockerfile COPY `mise.toml`, `mise.lock`, and the `.mise/locks` directory before `mise install`?
8. Do `mise tasks validate`, the `mise-review` validator, and `mise doctor project` (when needed) run early?
