# Profile Composition Shortcut

## 핵심 원칙

- profile은 라우터다.
- 상세 규칙은 root ecosystem reference가 소유한다.
- shared policy는 `mise-policy`가 소유한다.
- 선택 신호는 root `references/profile-composition.md`에 정리한다.
- 실제 starter 샘플은 root `references/profile-examples.md`와 `references/examples/`에 정리한다.

## Quick Mapping

- `pyproject.toml` + app/dev workflow -> `python-uv-app`
- `pyproject.toml` + build/publish workflow -> `python-uv-lib`
- `build.gradle*` + wrapper -> `java-gradle-app`
- `build.gradle*` + Spring signal -> `java-spring-service`
