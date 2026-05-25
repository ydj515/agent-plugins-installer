# python-uv-app

## 언제 쓰는가

- 일반 Python 애플리케이션
- `pyproject.toml`과 `uv.lock`을 함께 관리하는 저장소
- 로컬 `.venv` 자동 생성과 `uv sync` workflow가 필요한 경우

## selector 기준

- Python runtime: `3.12`
- uv: `0.11`

2026-05-24 기준 exact candidate는 다음이었다.

- `mise latest python@3.12` -> `3.12.13`
- `mise latest uv@0` -> `0.11.16`

## Example `mise.toml`

```toml
[tools]
python = "3.12"
uv = "0.11"

[settings]
python.uv_venv_auto = true

[env]
_.python.venv = { path = ".venv", create = true }
APP_ENV = "development"
APP_PORT = "8000"

[tasks.install]
description = "Sync Python dependencies into the project virtual environment."
run = "uv sync --frozen"

[tasks.lint]
description = "Run static analysis and formatting checks."
depends = ["install"]
run = "uv run ruff check . && uv run ruff format --check ."

[tasks.test]
description = "Run the automated test suite in the local uv environment."
depends = ["install"]
run = "uv run pytest"

[tasks.dev]
description = "Run the application in local development mode."
depends = ["install"]
run = "uv run python -m app"
```

## Notes

- selector는 사람이 읽기 쉬운 범위를 적고, patch resolution은 lockfile에 맡긴다.
- `uv sync --frozen`을 쓰려면 `uv.lock`이 저장소에 있어야 한다.
- package publishing 저장소라면 `python-uv-lib`와 release task 패턴을 같이 검토한다.
