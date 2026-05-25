# Python UV

## 역할

- uv selector, lock workflow, package build/publish 흐름을 다룬다.
- Python runtime 선택은 별도 문서와 조합해서 본다.
- app와 lib의 차이는 example 문서에서 concrete하게 본다.

## 기본 원칙

- uv selector floor는 shared policy와 profile 맥락 안에서 판단한다.
- Python runtime floor는 `references/ecosystems/python-runtime.md`와 함께 본다.
- `pyproject.toml`과 `uv.lock` workflow를 분리해서 설명한다.
- workspace라면 `.venv`와 dev dependency를 root 기준으로 본다.

## 점검 질문

- profile이 실제로 uv를 요구하는가
- selector 후보가 `mise ls-remote uv` 또는 `mise latest uv@<selector>` 결과와 맞는가
- selector가 현재 지원 floor보다 낮지 않은가
- app/dev workflow인지, build/publish workflow인지 구분했는가

## 같이 볼 문서

- Python runtime 정책: `references/ecosystems/python-runtime.md`
- Python app starter: `references/examples/python-uv-app.md`
- Python lib starter: `references/examples/python-uv-lib.md`
