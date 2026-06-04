# Autofix Boundaries

Use this reference before applying automated Thymeleaf accessibility fixes.

## Safe Changes

- Add missing `alt` text when the image purpose is decorative or obvious from nearby text.
- Link `label` and `for` when a unique field pairing is clear.
- Add `aria-describedby` when existing help text already explains the field.
- Add accessible names to icon-only buttons when the visible template context is clear.

## Avoid

- Landmark restructuring.
- Heading hierarchy rewrites.
- Link text rewrites that require content judgment.
- Widget ARIA changes for custom JavaScript components.
- Cross-template fragment edits without verifying downstream impact.
