# Policy Core

## 목적

이 문서는 `mise-workflows` 전체에 적용되는 공통 조직 정책을 정의한다. 언어별 세부 selector floor는 각 ecosystem reference가 소유한다.

## 공통 정책

- tracked `mise.toml`에는 `latest` 직접 저장 금지
- prerelease는 명시적 예외 없이는 금지
- 새 버전 채택 시 `minimum_release_age` gate 적용(mise 기본 24시간, 조직 기본값은 필요 시 강화)
- selector 후보는 `mise ls-remote` 또는 `mise latest`로 실제 해석 가능성을 확인
- 팀 저장소는 `mise.lock`을 커밋하고 CI는 `mise install --locked`로 설치
- review 결과는 `error`, `policy-error`, `warning`, `info`로 구분

## Trust와 실행 안전성

- `[env]`, `[hooks]`, `[settings]`, tool option, `include`, template 문법이 있는 config는 trust가 필요하다.
- 신뢰하지 않는 branch의 config를 읽는 자동화(예: lockfile bump bot)는 `MISE_SAFE=1`로 실행한다. safe mode는 task, `exec()`, hook, `_.source`를 막는다.
- 강한 통제가 필요한 개인 환경은 paranoid mode를 고려한다. config 내용이 바뀔 때마다 trust를 다시 요구한다.
- monorepo root를 trust하면 하위 config도 trust된다. root trust 전에 저장소 전체를 검토한다.

## Policy와 Official의 경계

- 공식 문서에서 deprecated 또는 제거 예정이면 최소 `warning`, 이미 제거되었거나 동작이 깨지면 `error`
- 조직 합의로 강제한 selector floor나 vendor 규칙은 `policy-error`
- 권장 사항이지만 강제하지 않는 항목은 `info`
- framework 관례는 가능하면 profile 또는 ecosystem reference에서 관리

## 소유권 원칙

- 공통 버전 가드: `mise-policy`
- profile 조합 규칙: `mise-profiles`
- lockfile 운영: `mise-lock`
- CI 연동: `mise-ci`
- 언어/build/package manager specifics: ecosystem reference
