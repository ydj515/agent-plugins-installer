# Python Runtime

## 역할

- Python runtime selector floor와 version file 전략을 다룬다.
- `.python-version`과 tracked `mise.toml`의 정합성을 다룬다.
- uv lock/publish workflow 자체는 이 문서가 직접 소유하지 않는다.

## 기본 원칙

- Python selector floor는 profile과 shared policy를 함께 보고 결정한다.
- `.python-version`과 tracked `mise.toml`의 전략을 맞춘다.
- workspace라면 root `.venv`와 hoisted dev dependency 전략을 먼저 본다.
- package manager 세부 관례는 `references/ecosystems/python-uv.md`와 함께 본다.

## 점검 질문

- selector 후보가 `mise ls-remote python` 결과와 맞는가
- selector가 profile floor보다 낮지 않은가
- version file 전략과 `mise.toml`이 서로 모순되지 않는가
- workspace root와 package 하위 디렉터리의 책임이 분리되어 있는가

## 같이 볼 문서

- uv selector와 lock workflow: `references/ecosystems/python-uv.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
