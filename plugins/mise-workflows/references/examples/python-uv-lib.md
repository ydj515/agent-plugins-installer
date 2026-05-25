# python-uv-lib

## 언제 쓰는가

- Python 라이브러리 또는 package 배포 중심 저장소
- `pyproject.toml` 기반 build backend와 `uv` workflow를 함께 관리하는 경우
- local 개발 task보다 build, package, publish 확인 흐름이 더 중요한 경우

## selector 기준

- Python runtime: `3.12`
- uv: `0.11`

2026-05-25 기준 exact candidate는 다음이었다.

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
PACKAGE_INDEX = "pypi"

[tasks.install]
description = "Sync library dependencies and developer tools."
run = "uv sync --frozen --all-extras"

[tasks.test]
description = "Run the test suite before building distribution artifacts."
depends = ["install"]
run = "uv run pytest"

[tasks.build]
description = "Build source and wheel distributions."
depends = ["test"]
run = "uv build"

[tasks.check-package]
description = "Verify generated distribution metadata."
depends = ["build"]
run = "uv run twine check dist/*"
```

## Notes

- application entrypoint보다 build artifact 품질과 publish readiness를 우선한다.
- 실제 publish 자체는 credential handling과 release policy에 맞춰 별도 task로 분리하는 편이 안전하다.
- 일반 app workflow가 중심이면 `python-uv-app` example을 먼저 시작점으로 잡는다.
