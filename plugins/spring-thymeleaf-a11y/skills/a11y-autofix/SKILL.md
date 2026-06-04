---
name: a11y-autofix
description: Use when a Spring Boot or Thymeleaf project already has an accessibility report and the user explicitly wants safe automated fixes, a dry-run change plan, or a rerun loop for unresolved accessibility violations.
---

# A11y Autofix

## Overview

Read an existing accessibility report, derive safe Thymeleaf fix candidates, and prepare the rerun step. Use only after `$a11y-audit-guide`.

## Workflow

1. Confirm the report path and project root before changing files.
2. Read `../../references/axe-result-policy.md`, `../../references/thymeleaf-fix-patterns.md`, and `../../references/autofix-boundaries.md`.
3. If runtime readiness is unclear, read `../../references/runtime-strategy.md`; do not install by default.
4. Generate a dry-run plan first; use manual report analysis if setup is blocked.
5. Apply only low-risk fixes with unambiguous intent.
6. Re-run the audit loop after changes, using the audit fallback only when the scripted runner cannot run.
7. Leave unresolved or context-heavy findings for manual review.

## Commands

From the plugin `scripts/` directory:

```bash
npm run autofix -- --report <path-to-report.json> --dry-run
npm run rerun -- --config <path-to-audit-config.json> --report <path-to-report.json>
```

## Output Rules

- Emit a plan file even when no file edits are applied.
- Record why a rule was skipped instead of silently ignoring it.
- Keep `incomplete` items open unless the user provides a manual resolution.
- State whether the plan or rerun used the scripted runner, a fresh setup, or a fallback.

## Handoff

- Use this skill only after `$a11y-audit-guide` has produced a report.
- If a safe fix cannot be proven, stop at the guide and ask for user confirmation before editing.
