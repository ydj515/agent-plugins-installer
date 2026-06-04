# Runtime Strategy

Use this reference when the plugin `scripts/` runtime is not clearly ready.

## Preferred Order

1. Prefer an already prepared runtime.
   - From `plugins/spring-thymeleaf-a11y/scripts`, check whether `node_modules/` exists.
   - If it exists, run the relevant `npm run ...` command without reinstalling.
2. Install only when the runtime is missing and installation is acceptable for the current task.
   - Prefer the lockfile-based command:

```bash
npm ci --ignore-scripts --prefer-offline --no-audit --no-fund
```

3. If installation is blocked, do not treat setup failure as an audit failure.
   - For audit tasks, use an available Browser or Playwright session to load the target pages and inject `axe-core`.
   - Save JSON and Markdown reports shaped like the normal audit outputs, and include an execution note such as `executionMode: "browser-injection-fallback"`.
   - For autofix tasks, derive a dry-run plan from the existing report and Thymeleaf templates. Use the audit fallback only for reruns.
4. Report the runtime path used.
   - Say whether the result came from the scripted runner, a fresh `npm ci`, or a browser-injection fallback.

## Installation Guardrails

- Do not run `npm install` as the default setup step.
- Prefer `npm ci` because `package-lock.json` is present and should define the reproducible dependency set.
- Keep `--ignore-scripts` unless the user explicitly approves lifecycle scripts.
- If Playwright browser binaries are missing after `--ignore-scripts`, either use an already available browser session or ask for the narrow setup step needed to install browsers.
- Avoid repeated installs in plugin cache directories; they are slow and may be read-only or policy-restricted.

## Fallback Report Expectations

- Preserve the normal page-level fields: `name`, `url`, `title`, `status`, `summary`, `violations`, and `incomplete`.
- Preserve the normal top-level fields: `generatedAt`, `configPath`, `overallStatus`, `totals`, and `pages`.
- Write a Markdown companion with the same basename as the JSON report.
- Add only small metadata that clarifies execution mode or limitations.
- Mark any page that could not be reached separately instead of mixing setup errors into axe violations.
