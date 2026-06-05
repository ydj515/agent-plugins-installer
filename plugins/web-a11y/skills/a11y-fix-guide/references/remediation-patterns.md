# Axe Remediation Patterns

Use these patterns as defaults, then adapt to the local framework and design system.

## Accessible Names

- `button-name`: Add visible text, `aria-label`, or visually hidden text to icon-only buttons. Prefer labels that include action and object, such as `aria-label="이전 슬라이드"` or `aria-label="프로젝트 상세 보기: {name}"`.
- `link-name`: Add visible text, `aria-label`, `aria-labelledby`, or visually hidden text to links. Do not rely on icon fonts alone.
- `select-name`: Add an explicit `<label for="...">`, wrap the select with a label, or add `aria-label` when a visible label would duplicate existing UI.
- `input-button-name`: Add `value`, `aria-label`, or visible text depending on the element type.
- `aria-command-name`: Ensure controls with ARIA command roles have a non-empty accessible name.

## Headings

- `page-has-heading-one`: Make the page's primary title an `h1`. Do not create a hidden `h1` unless the visible title cannot reasonably be changed.
- `heading-order`: Adjust heading levels so they increase by one level at a time. If a component uses heading styling for visual size, keep the visual style but change the semantic element.

## Landmarks and Bypass

- `landmark-one-main`: Wrap the unique primary content area in one `<main>` element or `role="main"`. Avoid multiple main landmarks.
- `region`: Move orphaned content into appropriate landmarks: `header`, `nav`, `main`, `aside`, or `footer`. For repeated navigation, provide distinguishing labels such as `aria-label="주 메뉴"` and `aria-label="페이지 이동"`.
- `bypass`: Add a skip link that targets the main content, such as `<a href="#main-content" class="skip-link">본문 바로가기</a>`, and ensure the target has `id="main-content"` and can receive focus when needed.

## Forms

- `label`: Associate every input with a visible `<label>`, `aria-label`, or `aria-labelledby`.
- `form-field-multiple-labels`: Keep one accessible name source per field unless multiple labels are intentional and correctly associated.
- `autocomplete-valid`: Use valid autocomplete tokens or remove invalid values.

## Images and Media

- `image-alt`: Add meaningful `alt` text for informative images. Use `alt=""` only for decorative images.
- `svg-img-alt`: Give meaningful inline SVGs a name or mark decorative SVGs hidden.

## Tables

- `table-fake-caption`: Use `<caption>` for table captions when the text describes the table.
- `td-headers-attr`: Ensure `headers` values reference existing header cell ids.
- Prefer semantic `<th scope="col">` and `<th scope="row">` before complex ARIA.

## ARIA and Keyboard

- `aria-*`: Prefer correcting native HTML before adding ARIA. Remove invalid ARIA attributes rather than layering more ARIA.
- `aria-required-children` / `aria-required-parent`: Ensure ARIA roles are used with the required structure, or replace with native elements.
- Keyboard/focus rules: Preserve visible focus indicators and ensure controls are reachable and operable by keyboard.

## Color Contrast

Do not fix `color-contrast` without explicit user approval in the current thread. After approval:

- Confirm whether the issue is a `violation` or `incomplete`.
- Measure the foreground/background pair where possible.
- Prefer token-level changes when a design token is clearly responsible.
- Prefer local overlays or text color changes when the issue is limited to image/gradient text.
- Recheck affected states after the change.
