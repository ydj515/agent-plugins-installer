# Env Core

## 목적

이 문서는 `mise`의 `[env]` 설계와 local override 운영에 대한 공통 기준을 정의한다.

## 기본 원칙

- `[env]`는 비밀값이 아닌 프로젝트 설정의 single source of truth로 우선 고려한다.
- 애플리케이션 코드는 항상 기본값을 가져 `mise` 없이도 동작해야 한다.
- 파일 로드, PATH 확장, script source는 `env._.*` directive를 사용한다.
- local-only 값은 `mise.local.toml` 또는 `mise.<env>.local.toml`로 분리하고 `.gitignore`에 넣는다.
- secret이나 사용자 로컬 경로는 tracked config에 평문으로 넣지 않는다. 암호화나 secret manager는 `references/secrets.md`를 본다.
- `required`, `default`, `redact`, `tools`, 각 directive의 역할을 분리해서 사용한다.

## 값의 형태

| 형태 | 예 | 의미 |
| --- | --- | --- |
| 값 | `APP_PORT = "8000"` | 항상 이 값으로 설정 |
| 기본값 | `NODE_ENV = { default = "development" }` | 이미 비어 있지 않은 값이 있으면 유지 |
| 필수 | `DATABASE_URL = { required = "설정 방법 안내" }` | 다른 config나 환경에서 설정되어야 함. `value`, `default`와 함께 쓸 수 없음 |
| 민감값 | `API_KEY = { value = "...", redact = true }` | task 출력에서 마스킹 |
| tool 이후 계산 | `NODE_VERSION = { value = "{{ tools.node.version }}", tools = true }` | tool 로드 후 평가 |
| 해제 | `OLD_VAR = false` | 변수 제거 |

- 값은 Tera v2 template과 shell 스타일 확장(`$VAR`, `${VAR:-default}`)을 모두 지원한다. shell 확장은 기본으로 켜져 있다(`env_shell_expand`).
- 값은 같은 파일에서 위에 정의된 값, 낮은 우선순위 config, mise 시작 시 환경만 참조할 수 있다.
- `MISE_*` 변수는 mise 시작 시 읽히므로 `[env]`에 넣어도 그 mise 프로세스의 동작을 바꾸지 않는다. `[settings]`나 shell 환경에서 설정한다.

## Directive

- 파일 로드: `_.file` (`.env`, `.json`, `.yaml`, `.toml`)
- PATH 확장: `_.path`. `[env]`의 `PATH` 키는 `mise exec`에서 무시되므로 쓰지 않는다
- shell source: `_.source` (Windows는 POSIX bash 필요)
- Python venv: `_.python.venv` (uv 프로젝트는 `references/ecosystems/python-uv.md`)
- directive는 적힌 순서대로 실행되고 `_.python.venv`는 항상 마지막이다.

## 우선순위

- `mise.local.toml` > `mise.toml`
- `MISE_ENV=dev`이면 `mise.dev.local.toml` > `mise.local.toml` > `mise.dev.toml` > `mise.toml`
- 하위 디렉터리 config > 상위 디렉터리 config > global config

## 자주 같이 읽을 문서

- `env-patterns.md`
- `secrets.md`
- `hub-spoke-architecture.md`
- `monorepo-workspace.md`
- `github-tokens.md`

## 금지 또는 회피 패턴

- deprecated top-level `env_file`, `dotenv`, `env_path` (2027.4.0 제거)
- deprecated `env.mise.*` (2026.12.0 제거), directive table 안의 `value`, `values` 키
- `[env]` 안에 `redactions`를 넣는 패턴. `redactions`는 top-level 키다
- `.gitignore` 없이 local config나 local lockfile을 추가하는 패턴
- `mise exec -- script.py`처럼 실행 경로를 `mise`에 강결합하는 패턴

## 검토 체크리스트

- local config(`mise.local.toml`, `mise.*.local.toml`)와 local lockfile(`mise.local.lock`, `mise.*.local.lock`)이 `.gitignore`에 포함되는가
- `raw = true` task와 `redact = true` 사용이 충돌하지 않는가. raw task는 redaction을 하지 않는다
- script가 환경 변수 기본값 없이 `mise` activation을 전제로 하지 않는가
- `required`가 필요한 곳에 help text가 있는가
- monorepo라면 root hub와 spoke의 책임이 분리되어 있는가
