# python-uv-app

## 언제 쓰는가

- 일반 Python 애플리케이션
- `pyproject.toml`과 `uv.lock`을 함께 관리하는 저장소
- 로컬 `.venv` 자동 생성과 `uv sync` workflow가 필요한 경우

## selector 기준

- Python runtime: `3.14`
- uv: `0.13`

2026-10-16 기준 exact candidate는 다음이었다.

- `mise latest python@3.14` -> `3.14.8`
- `mise latest uv@0.13` -> `0.13.1`

## Example `mise.toml`

```toml
min_version = "2026.7.0"

[tools]
python = "3.14"
uv = "0.13"

[settings]
lockfile = true
python.uv_venv_auto = "create|source"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
APP_ENV = { default = "development" }
APP_PORT = "8000"

[tasks.install]
description = "Sync Python dependencies into the project virtual environment."
usage = '''
about "mise run install: sync Python dependencies into the project virtual environment"
'''
sources = ["pyproject.toml", "uv.lock"]
outputs = [".venv/pyvenv.cfg"]
run = "uv sync --frozen"

[tasks.lint]
description = "Run static analysis and formatting checks."
usage = '''
about "mise run lint: run static analysis and formatting checks"
'''
depends = ["install"]
run = "uv run ruff check . && uv run ruff format --check ."

[tasks.test]
description = "Run the automated test suite in the local uv environment."
usage = '''
about "mise run test: run the automated test suite in the local uv environment"
'''
depends = ["install"]
run = "uv run pytest"

[tasks.dev]
description = "Run the application in local development mode."
usage = '''
about "mise run dev: run the application in local development mode"
'''
depends = ["install"]
run = "uv run python -m app"

[tasks.ci]
description = "Run the full verification pipeline used by CI."
usage = '''
about "mise run ci: run the full verification pipeline used by CI"
'''
depends = ["lint", "test"]
run = "echo ci passed"
```

## Notes

- `min_version`은 `python.uv_venv_auto = "create|source"` 형식을 지원하는 버전 이상으로 둔다.
- `_.python.venv`는 함께 쓰지 않는다. uv 프로젝트는 `python.uv_venv_auto` 하나로 venv를 관리한다.
- request는 사람이 읽기 쉬운 범위를 적고, patch resolution은 `mise.lock`에 맡긴다. `mise.lock`은 커밋한다.
- `uv sync --frozen`을 쓰려면 `uv.lock`이 저장소에 있어야 한다.
- `install`은 `sources`, `outputs`로 의존성이 바뀌지 않으면 건너뛴다.
- package publishing 저장소라면 `python-uv-lib`와 release task 패턴을 같이 검토한다.
