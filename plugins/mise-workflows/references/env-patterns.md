# Env Patterns

## 목적

이 문서는 `mise`의 `[env]`를 실제 프로젝트에서 사용할 때 반복되는 구현 패턴을 정리한다.

## Single Source of Truth

- 비밀값이 아닌 설정값은 가능하면 `[env]`를 단일 진입점으로 둔다.
- 애플리케이션 코드는 항상 기본값을 가져야 하며, `mise`가 없어도 동작해야 한다.
- `mise`는 설정 주입 계층이고, 애플리케이션은 그 값을 소비하는 계층이다.

## Python venv 자동 생성

프로젝트 단위 가상환경을 `mise`가 관리해야 한다면 `[env]`에 다음 패턴을 우선 고려한다.

```toml
[env]
_.python.venv = { path = ".venv", create = true }
```

대안으로 전체 동작을 settings에 두고 싶다면:

```toml
[settings]
python.uv_venv_auto = true
```

## Special Directives

- `_.file`: `.env`, `.env.local` 같은 파일을 로드한다.
- `_.path`: `bin`, `node_modules/.bin` 같은 실행 경로를 확장한다.
- `_.source`: bash 스크립트를 source 해서 환경을 계산한다.
- `_.python.venv`: Python 가상환경을 만들고 활성화한다.

예시:

```toml
[env]
_.file = [".env", { path = ".env.local", redact = true }]
_.path = ["bin", "node_modules/.bin"]
_.source = { path = "./scripts/dev-env.sh", redact = true }
```

## Tera 템플릿 요약

- 표현식: `{{ ... }}`
- 제어문: `{% ... %}`
- 주석: `{# ... #}`

자주 쓰는 값:

- `config_root`
- `cwd`
- `env.VAR`
- `xdg_cache_home`

자주 쓰는 함수/필터:

- `get_env`
- `read_file`
- `hash_file`
- `snakecase`
- `trim`
- `absolute`

정적인 파일 값을 읽을 때는 `read_file`을 우선하고, 단순 파일 읽기 때문에 `exec()`를 쓰는 패턴은 피한다.

## Required / Redact / tools = true

```toml
[env]
DATABASE_URL = { required = true }
API_KEY = { required = "사내 비밀 저장소에서 발급 후 설정" }
_.file = { path = ".env.secrets", redact = true }
GEM_BIN = { value = "{{env.GEM_HOME}}/bin", tools = true }
redactions = ["*_TOKEN", "*_KEY", "PASSWORD"]
```

- `required`는 값이 없을 때 빠르게 실패하게 만든다.
- `redact`는 출력 노출을 줄인다.
- `tools = true`는 tool 설치 이후 값을 계산해야 할 때만 사용한다.

## 애플리케이션 기본값 패턴

Python:

```python
import os

timeout_seconds = int(os.environ.get("APP_TIMEOUT_SECONDS", "30"))
```

Bash:

```bash
timeout_seconds="${APP_TIMEOUT_SECONDS:-30}"
```

핵심은 `mise`가 없어도 동일한 코드 경로가 유지되어야 한다는 점이다.

## 언제 Tasks로 넘길지

다음 신호가 보이면 `mise-tasks`로 handoff한다.

- 여러 단계가 순서를 가진다
- 재실행 가능한 workflow가 필요하다
- build/test/release가 DAG로 표현되어야 한다
- file tracking이나 watch가 필요하다

## 검토 질문

- `[env]`가 비밀값 아닌 설정의 단일 진입점 역할을 하는가
- 기본값이 있어 `mise` 없이도 코드가 실행되는가
- `_.python.venv`와 `python.uv_venv_auto` 중 하나만 명확히 선택했는가
- `exec()` 없이 더 단순한 템플릿 표현이 가능한가
