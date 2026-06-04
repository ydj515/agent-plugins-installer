---
name: a11y-audit-guide
description: Use when auditing Spring Boot or Thymeleaf pages with Playwright and axe-core, when producing JSON accessibility reports for server-rendered templates, or when turning accessibility violations into Spring and Thymeleaf fix guidance.
---

# A11y Audit Guide

## Overview

Run a Playwright-based accessibility audit for a Spring Boot + Thymeleaf application, save a JSON report, and turn the findings into a Thymeleaf-oriented fix guide. Prefer this skill for report generation and issue interpretation, not for automatic code edits.

## Workflow

1. Confirm the app entry point and the audit config file.
2. Read `../../references/config-examples.md` if the config format is not ready.
3. Install script dependencies from `../../scripts/` when `node_modules/` is missing.
4. Run the audit command to produce a JSON report.
5. Read `../../references/axe-result-policy.md` to classify the result as `FAIL`, `REVIEW`, or `PASS`.
6. Generate the fix guide markdown from the JSON report.
7. Summarize the highest-severity violations first and map them to Thymeleaf fixes.
8. If the user explicitly wants automated edits, switch to `$a11y-autofix`.

## Commands

From the plugin `scripts/` directory:

```bash
npm install --ignore-scripts
npm run audit -- --config <path-to-audit-config.json>
npm run fix-guide -- --report <path-to-report.json>
```

## Expected Inputs

- A reachable Spring Boot application URL such as `http://localhost:8080`
- An audit config JSON file with page URLs or flows
- Optional login state or wait selectors for pages that need asynchronous content to settle

## Output Policy

- Treat any non-zero `violations` count as `FAIL`.
- Treat `violations = 0` and `incomplete > 0` as `REVIEW`.
- Treat `violations = 0` and `incomplete = 0` as `PASS`.
- Always explain `critical` and `serious` items before `moderate` and `minor`.

## Thymeleaf Guidance

- Use `../../references/thymeleaf-fix-patterns.md` to turn rule IDs into concrete template changes.
- Prefer fixing shared fragments only when the same issue repeats across multiple pages.
- When the root cause is ambiguous, name the likely fragment or template pattern instead of guessing a specific file.

## Handoff

- Use this skill until a report and fix guide exist.
- Use `$a11y-autofix` only after the user explicitly asks for automated edits.
