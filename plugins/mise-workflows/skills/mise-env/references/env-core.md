# Env Execution Checklist

## 먼저 읽을 문서

- `../../references/env-core.md`
- `../../references/policy-core.md`
- `../../references/env-patterns.md`
- 필요 시 `../../references/hub-spoke-architecture.md`
- 필요 시 `../../references/github-tokens.md`

## 점검 순서

1. tracked env와 local env를 분리한다.
2. deprecated top-level env key가 있는지 본다.
3. script가 기본값을 가져 `mise` 없이도 동작하는지 본다.
4. `.gitignore`와 local file tracking 상태를 확인한다.
5. `required`와 `redact`의 의미를 실제 출력 흐름과 맞춘다.
6. multi-step workflow 신호가 보이면 `mise-tasks`로 넘긴다.
