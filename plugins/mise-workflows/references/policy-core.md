# Policy Core

## 목적

이 문서는 `mise-workflows` 전체에 적용되는 공통 조직 정책을 정의한다. 언어별 세부 selector floor는 각 확장 skill이 소유한다.

## 공통 정책

- tracked `mise.toml`에는 `latest` 직접 저장 금지
- prerelease는 명시적 예외 없이는 금지
- 새 버전 채택 시 release age gate 적용
- selector 후보는 `mise ls-remote` 또는 `mise latest`로 실제 해석 가능성을 확인
- review 결과는 `error`, `warning`, `policy-error`, `info`로 구분

## Policy와 Official의 경계

- 공식 문서에서 deprecated 또는 no-op이면 최소 `warning`, 경우에 따라 `error`
- 조직 합의로 강제한 selector floor나 vendor 규칙은 `policy-error`
- framework 관례는 가능하면 profile 또는 ecosystem skill에서 관리

## 소유권 원칙

- 공통 버전 가드: `mise-policy`
- profile 조합 규칙: `mise-profiles`
- 언어/build/package manager specifics: 확장 skill
