# Policy Checklist

## 이 skill이 직접 소유하는 것

- `latest` 금지
- npm 스타일 range 금지
- prerelease 기본 금지
- `minimum_release_age` 공통 가드와 예외 기준
- trust, safe mode, paranoid mode 사용 기준
- severity 기준(`info`, `warning`, `policy-error`, `error`)

## 이 skill이 직접 소유하지 않는 것

- Java vendor 명시 규칙
- Gradle major floor
- Python selector floor
- uv selector floor
- lockfile 생성과 플랫폼 운영(`mise-lock`)
- CI install 흐름(`mise-ci`)
