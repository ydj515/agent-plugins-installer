# Task Anti-Patterns

- Tasks missing any of `description`, `usage` (`about`), or `run`
- Mixing deprecated Tera `arg()`, `option()`, `flag()` with `usage`
- Cramming very long shell into a single TOML string
- File task comments that formatters break
- Release or publish tasks that do not depend on the build artifact
- Chaining long-running remote jobs only through `depends`
- Using task names with `:` as unquoted TOML keys
- Relying on `experimental_monorepo_root` or automatic discovery in a monorepo
- Wrapping a command in `mise exec node@24 -- npm test` when the version matches `[tools]` (the prefix can resolve to another installed version and bypass the `[tools]` pin)
