# Contributing to agent-plugins-installer

Thank you for contributing to `agent-plugins-installer`. Please review the environment setup and verification steps below before submitting changes. For detailed target layouts and marketplace architecture, see the [Usage & Architecture Guide](./docs/GUIDE.md).

## 1. Development Setup

Node.js (`24.19.0`) and common tasks are defined in [`mise.toml`](./mise.toml). Runtime compatibility is verified across Node.js `20`, `22`, and `24`.

```bash
mise trust
mise install
mise tasks
```

## 2. Code & Bundle Guidelines

- **Plugin Source Structure:** Place shared assets under [`plugins/<plugin-id>/`](./plugins) and target-specific manifest overlays under `plugins/<plugin-id>/targets/<codex|claude|gemini>/`.
- **Catalog & Direct Bundle Sync:** Whenever you update [`catalog.json`](./catalog.json) or files under `plugins/`, synchronize the generated direct bundles and repository marketplace manifests:
  ```bash
  npm run sync:direct-bundles
  ```
- **Commit Messages:** Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `build:`, `test:`).

## 3. Required Verification

All changes must pass the local verification gate before opening a pull request:

```bash
mise run verify
```

If your changes affect runtime compatibility or packaging behavior, also run the multi-version Node.js test matrix:

```bash
mise run test-matrix
```

## 4. References

- [Usage & Architecture Guide](./docs/GUIDE.md)
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- [Changelog](./CHANGELOG.md)
