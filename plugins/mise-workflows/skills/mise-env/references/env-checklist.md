# Env Execution Checklist

## 먼저 읽을 문서

- `../../../references/env-core.md`
- `../../../references/policy-core.md`
- `../../../references/env-patterns.md`
- 필요 시 `../../../references/secrets.md`
- 필요 시 `../../../references/hub-spoke-architecture.md`
- 필요 시 `../../../references/github-tokens.md`

## 점검 순서

1. tracked env와 local env(`mise.local.toml`, `mise.<env>.local.toml`)를 분리한다.
2. deprecated 문법(`env_file`, `dotenv`, `env_path`, `env.mise.*`, directive table의 `value`)이 있는지 본다.
3. `redactions`가 top-level에 있는지 확인한다.
4. Tera v1 helper와 정의되지 않은 변수 참조를 찾는다.
5. Python venv 방식이 하나만 선택되었는지 확인한다.
6. script가 기본값을 가져 `mise` 없이도 동작하는지 본다.
7. `.gitignore`와 local config/lockfile tracking 상태를 확인한다.
8. `required`, `default`, `redact`의 의미를 실제 출력 흐름과 맞춘다.
9. multi-step workflow 신호가 보이면 `mise-tasks`로 넘긴다.
