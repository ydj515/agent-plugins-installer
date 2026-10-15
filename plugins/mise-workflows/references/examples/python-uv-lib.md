# python-uv-lib

## 언제 쓰는가

- Python 라이브러리 또는 package 배포 중심 저장소
- `pyproject.toml` 기반 build backend와 `uv` workflow를 함께 관리하는 경우
- local 개발 task보다 build, package, publish 확인 흐름이 더 중요한 경우

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

[tasks.install]
description = "Sync library dependencies and developer tools."
usage = '''
about "mise run install: sync library dependencies and developer tools"
'''
sources = ["pyproject.toml", "uv.lock"]
outputs = [".venv/pyvenv.cfg"]
run = "uv sync --frozen --all-extras"

[tasks.test]
description = "Run the test suite before building distribution artifacts."
usage = '''
about "mise run test: run the test suite before building distribution artifacts"
'''
depends = ["install"]
run = "uv run pytest"

[tasks.build]
description = "Build source and wheel distributions."
usage = '''
about "mise run build: build source and wheel distributions"
'''
depends = ["test"]
sources = ["pyproject.toml", "src/**"]
outputs = ["dist"]
run = "uv build"

[tasks.check-package]
description = "Verify generated distribution metadata."
usage = '''
about "mise run check-package: verify generated distribution metadata"
'''
depends = ["build"]
run = "uv run twine check dist/*"
```

## Notes

- application entrypoint보다 build artifact 품질과 publish readiness를 우선한다.
- `twine`은 dev dependency group에 둔다. 도구로만 쓰고 싶다면 `[tools]`에 `"pypi:twine"`을 선언한다.
- 실제 publish 자체는 credential handling과 release policy에 맞춰 별도 task로 분리한다. publish credential은 publish task에만 전달한다.
- 일반 app workflow가 중심이면 `python-uv-app` example을 먼저 시작점으로 잡는다.
