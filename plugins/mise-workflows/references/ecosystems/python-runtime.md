# Python Runtime

## 역할

- Python runtime selector floor와 version file 전략을 다룬다.
- `.python-version`과 tracked `mise.toml`의 정합성을 다룬다.
- uv lock/publish workflow 자체는 이 문서가 직접 소유하지 않는다.

## 기본 원칙

- Python selector floor는 profile과 shared policy를 함께 보고 결정한다.
- `.python-version`과 tracked `mise.toml` 중 하나를 source of truth로 정한다. 같은 디렉터리에서는 `mise.toml`이 이긴다.
- `.python-version`은 `idiomatic_version_file_enable_tools`에 `python`을 추가해야 읽힌다.
- workspace라면 root `.venv`와 hoisted dev dependency 전략을 먼저 본다.
- package manager 세부 관례는 `references/ecosystems/python-uv.md`와 함께 본다.
- mise는 기본적으로 python-build-standalone의 precompiled build를 내려받는다. source build(`python.compile`)는 특별한 이유가 있을 때만 쓴다.

## 기본 정책

- 신규 프로젝트 추천 selector: `3.14`
- 최소 floor: `3.13`. 3.12 이하는 보안 수정만 받는 단계이므로 신규 채택하지 않는다
- 새 minor(예: 3.15)는 주요 의존성 지원을 확인한 뒤 채택한다
- 2026-10-16 기준 후보: `mise latest python@3.14` → `3.14.8`, `mise latest python@3.13` → `3.13.16`, `mise latest python@3` → `3.15.0`

## 점검 질문

- selector 후보가 `mise ls-remote python` 결과와 맞는가
- selector가 profile floor보다 낮지 않은가
- version file 전략과 `mise.toml`이 서로 모순되지 않는가
- workspace root와 package 하위 디렉터리의 책임이 분리되어 있는가

## 같이 볼 문서

- uv selector와 lock workflow: `references/ecosystems/python-uv.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
