# Python UV

## 역할

- uv selector, venv 활성화, lock workflow, package build/publish 흐름을 다룬다.
- Python runtime 선택은 별도 문서와 조합해서 본다.
- app와 lib의 차이는 example 문서에서 concrete하게 본다.

## 기본 원칙

- uv selector floor는 shared policy와 profile 맥락 안에서 판단한다.
- Python runtime floor는 `references/ecosystems/python-runtime.md`와 함께 본다.
- `pyproject.toml`, `uv.lock`(애플리케이션 의존성)과 `mise.lock`(도구 버전)을 분리해서 설명한다.
- workspace라면 `.venv`와 dev dependency를 root 기준으로 본다.

## venv 활성화

uv 프로젝트는 `_.python.venv` 대신 `python.uv_venv_auto`를 쓴다.

```toml
[tools]
python = "3.14"
uv = "0.13"

[settings]
python.uv_venv_auto = "create|source"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
```

- `"create|source"`: 가장 가까운 `uv.lock` 옆 `.venv`가 없으면 uv로 만들고 활성화한다.
- `"source"`: 활성화만 한다. venv가 없으면 `uv sync`를 하라는 경고가 난다.
- `uv.lock`이 없으면 이 setting은 아무 일도 하지 않는다.
- `UV_PYTHON`을 mise interpreter 경로로 두면 uv가 자체적으로 내려받은 Python 대신 mise가 고른 Python을 쓴다.
- `python.uv_venv_auto = true`는 deprecated(2027.7.0 제거)다. `true`는 `UV_PYTHON`에 버전 번호만 넣었으므로 위 패턴으로 대체한다.
- `UV_PROJECT_ENVIRONMENT`로 venv 경로를 바꿀 수 있다.

## 기본 정책

- 신규 프로젝트 추천 selector: `0.13`
- uv는 0.x 단계라 minor가 바뀔 때 동작이 달라질 수 있으므로 minor까지 적는다
- 2026-10-16 기준 후보: `mise latest uv@0.13` → `0.13.1`
- registry의 `uv`는 `aqua:astral-sh/uv` backend를 쓴다

## uv로 설치하는 CLI 도구

ruff, black 같은 Python CLI를 프로젝트 의존성이 아니라 도구로 관리하려면 `pypi:` backend를 쓴다(`pipx:`는 alias). registry short name이 있으면(`ruff`) 그쪽을 먼저 쓴다. lockfile format 2부터 `pypi:` 도구의 의존성 그래프가 `uv.lock` sidecar로 고정된다(uv 0.12.10 이상).

## 점검 질문

- profile이 실제로 uv를 요구하는가
- selector 후보가 `mise ls-remote uv` 또는 `mise latest uv@<selector>` 결과와 맞는가
- `_.python.venv`와 `python.uv_venv_auto`를 동시에 쓰지 않는가
- app/dev workflow인지, build/publish workflow인지 구분했는가

## 같이 볼 문서

- Python runtime 정책: `references/ecosystems/python-runtime.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
