# Env Core

## 목적

이 문서는 `mise`의 `[env]` 설계와 local override 운영에 대한 공통 기준을 정의한다.

## 기본 원칙

- `[env]`는 비밀값이 아닌 프로젝트 설정의 single source of truth로 우선 고려한다.
- 애플리케이션 코드는 항상 기본값을 가져 `mise` 없이도 동작해야 한다.
- 새로운 설정은 `env._.*` 패턴을 우선 사용한다.
- local-only 값은 `mise.local.toml` 또는 `mise.*.local.toml`로 분리한다.
- secret이나 사용자 로컬 경로는 tracked config에 직접 넣지 않는다.
- `required`, `redact`, `file`, `source`, `path`의 역할을 분리해서 사용한다.

## 권장 패턴

- 파일 로드: `env._.file`
- shell source: `env._.source`
- 필수 변수 강제: `required = true`
- 출력 노출 억제: `redact = true`
- Python venv 자동 생성: `env._.python.venv`
- tool 설치 이후 계산 필요 시: `tools = true`

## 자주 같이 읽을 문서

- `env-patterns.md`
- `hub-spoke-architecture.md`
- `monorepo-workspace.md`
- `github-tokens.md`

## 금지 또는 회피 패턴

- deprecated top-level `env_file`
- deprecated top-level `dotenv`
- deprecated top-level `env_path`
- `.gitignore` 없이 local config를 추가하는 패턴
- `mise exec -- script.py`처럼 실행 경로를 `mise`에 강결합하는 패턴

## 검토 체크리스트

- local config 파일이 `.gitignore`에 포함되는가
- `raw = true` task와 `redact = true` 사용이 충돌하지 않는가
- local lockfile이 실수로 추적되지 않는가
- script가 환경 변수 기본값 없이 `mise` activation을 전제로 하지 않는가
- monorepo라면 root hub와 spoke의 책임이 분리되어 있는가
