# Env Patterns

## 목적

이 문서는 `mise`의 `[env]`를 실제 프로젝트에서 사용할 때 반복되는 구현 패턴을 정리한다.

## Single Source of Truth

- 비밀값이 아닌 설정값은 가능하면 `[env]`를 단일 진입점으로 둔다.
- 애플리케이션 코드는 항상 기본값을 가져야 하며, `mise`가 없어도 동작해야 한다.
- `mise`는 설정 주입 계층이고, 애플리케이션은 그 값을 소비하는 계층이다.

## Python 가상환경

두 방식 중 하나만 고른다.

| 방식 | 대상 | 위치 |
| --- | --- | --- |
| `_.python.venv` | uv를 쓰지 않는 프로젝트 | `[env]` |
| `python.uv_venv_auto` | `uv.lock`이 있는 uv 프로젝트 | `[settings]` |

uv를 쓰지 않는 프로젝트:

```toml
[env]
_.python.venv = { path = ".venv", create = true }
```

uv 프로젝트:

```toml
[settings]
python.uv_venv_auto = "create|source"
```

- `"source"`는 uv가 만든 venv를 활성화만 하고, `"create|source"`는 없으면 만든다.
- `python.uv_venv_auto = true`는 2026.7.0부터 경고하며 2027.7.0에서 제거된다.
- Python tool option의 `virtualenv`도 deprecated다. `_.python.venv`로 옮긴다.

## Special Directives

- `_.file`: `.env`, `.json`, `.yaml`, `.toml` 파일을 로드한다. 없는 파일은 오류 없이 건너뛴다.
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

## Tera v2 템플릿

mise는 Tera v2로 template을 렌더링한다.

- 표현식: `{{ ... }}`
- 제어문: `{% ... %}`
- 주석: `{# ... #}`

자주 쓰는 값:

- `config_root`: 프로젝트 디렉터리. 하위 디렉터리에서 실행해도 고정된다
- `cwd`: mise를 실행한 디렉터리
- `env.VAR`
- `tools.<name>.version`, `tools.<name>.path` (`tools = true` 필요)
- `xdg_cache_home`, `xdg_config_home`

자주 쓰는 함수/필터:

- `read_file(path=...)`: 상대 경로는 template이 있는 config 디렉터리 기준
- `env.NAME | default(value="...")`: `get_env()`보다 우선한다. `get_env()`는 `[env]` 값을 보지 못한다
- `hash_file`, `snakecase`, `trim`, `trim_start(pat=...)`, `absolute`, `basename`

Tera v1에서 v2로 바뀐 부분:

- `trim_start_matches` → `trim_start`, `trim_end_matches` → `trim_end`
- `as_str` → `str`, `escape` → `escape_html`
- `slice(...)` → `items[0:2]`, `map(attribute=...)` → `[item.name for item in items]`
- v2는 정의되지 않은 변수에서 실패한다. `default` filter로 방어한다
- v1 helper는 2026.10.0부터 경고하고 2027.4.0에서 제거된다

정적인 파일 값을 읽을 때는 `read_file`을 우선한다. `exec()`는 렌더링할 때마다 실행되므로 꼭 필요할 때만 `cache_key`, `cache_duration`과 함께 쓴다.

## Required / Default / Redact / tools = true

```toml
redactions = ["*_TOKEN", "*_KEY", "PASSWORD"]

[env]
NODE_ENV = { default = "development" }
DATABASE_URL = { required = true }
API_KEY = { required = "사내 비밀 저장소에서 발급 후 mise.local.toml에 설정" }
_.file = { path = ".env.secrets", redact = true }
GEM_BIN = { value = "{{ env.GEM_HOME }}/bin", tools = true }
```

- `redactions`는 `[env]` 밖, 파일 최상단의 top-level 키다. `[env]` 안에 두면 일반 변수로 취급된다.
- `required`는 값이 없을 때 `mise exec`, `mise run`, `mise env`를 멈춘다. 활성화된 shell에서는 경고만 한다.
- `default`는 이미 값이 있으면 덮어쓰지 않는다.
- `redact`는 task 출력과 CI 로그 노출을 줄인다. `raw = true` task는 마스킹하지 않는다.
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

## Config Environments

- `MISE_ENV=dev`이면 `mise.dev.toml`, `mise.dev.local.toml`이 추가로 로드된다.
- 환경별 lockfile(`mise.dev.lock`)은 해당 환경 config가 선언한 도구만 담는다.
- 환경 기본값은 `.miserc.toml`에 둘 수 있다. `.miserc.toml`은 trust가 필요 없지만 `exec()`, `read_file()`을 쓸 수 없다.

## 언제 Tasks로 넘길지

다음 신호가 보이면 `mise-tasks`로 handoff한다.

- 여러 단계가 순서를 가진다
- 재실행 가능한 workflow가 필요하다
- build/test/release가 DAG로 표현되어야 한다
- file tracking이나 watch가 필요하다

## 검토 질문

- `[env]`가 비밀값 아닌 설정의 단일 진입점 역할을 하는가
- 기본값이 있어 `mise` 없이도 코드가 실행되는가
- `_.python.venv`와 `python.uv_venv_auto` 중 하나만 선택했는가
- `redactions`가 top-level에 있는가
- Tera v1 helper나 정의되지 않은 변수 참조가 남아 있지 않은가
- `exec()` 없이 더 단순한 template 표현이 가능한가
