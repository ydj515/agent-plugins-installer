# Spring Thymeleaf A11y Extension

This Gemini CLI extension bundles accessibility audit and safe-fix workflow skills for Spring Boot and Thymeleaf applications.

Preferred workflow:

- use `a11y-audit-guide` first to produce the report and Thymeleaf-oriented fix guide
- switch to `a11y-autofix` only when the user explicitly asks for safe automated edits
- keep edits scoped to the current Spring application unless the user asks to widen the change
