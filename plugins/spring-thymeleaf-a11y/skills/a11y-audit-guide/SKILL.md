---
name: a11y-audit-guide
description: Use when auditing Spring Boot or Thymeleaf pages with Playwright and axe-core, when producing JSON accessibility reports for server-rendered templates, or when turning accessibility violations into Spring and Thymeleaf fix guidance.
---

# A11y Audit Guide

## Overview

Run a Playwright + axe audit for Spring Boot + Thymeleaf pages and produce JSON plus Markdown reports. Do not edit code with this skill.

## Workflow

1. Confirm the app URL and audit config; read `../../references/config-examples.md` only if needed.
2. If runtime readiness is unclear, read `../../references/runtime-strategy.md`; do not install by default.
3. Run the scripted audit or documented fallback to produce JSON and Markdown reports.
4. Classify with `../../references/axe-result-policy.md`.
5. Generate the scripted fix guide as Markdown and JSON when available; otherwise summarize the report and note the fallback.
6. Summarize critical and serious items first, using `../../references/thymeleaf-fix-patterns.md`.
7. If the user explicitly wants automated edits, switch to `$a11y-autofix`.

## Commands

From the plugin `scripts/` directory:

```bash
npm run audit -- --config <path-to-audit-config.json>
npm run fix-guide -- --report <path-to-report.json>
```

## Reporting

- State whether the report used the scripted runner, a fresh setup, or a fallback.
- Produce both `.json` and `.md` outputs for audit reports and fix guides.
- Prefer shared fragments only when the issue repeats; otherwise name likely templates or fragments.
