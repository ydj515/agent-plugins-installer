# Version Policy

## 버전 선택 절차

1. profile을 결정한다.
2. 해당 profile의 관련 ecosystem reference를 확인한다.
3. `mise ls-remote <tool>` 또는 `mise latest <tool@selector>`로 후보를 확인한다.
4. 가능한 경우 major/minor selector 범위를 먼저 좁힌다.
5. prerelease를 제외한다.
6. `minimum-release-age`를 만족하는 최신 stable 후보를 고른다.
7. 너무 낮은 floor가 아닌지 ecosystem reference 규칙으로 다시 확인한다.

## 저장 전략

- `mise.toml`: selector 중심
- `mise.lock`: exact resolution 중심
- 예외적으로 reproducibility가 더 중요하면 exact pin 허용

## 기본 가드

- `latest` 금지
- prerelease 기본 금지
- 너무 낮은 selector 금지
- age gate 미만 버전 경고 또는 정책 오류

## Review 질문

- 이 selector는 `mise`가 해석 가능한가
- 이 selector는 profile과 ecosystem-specific floor를 만족하는가
- exact pin이 필요한지, lockfile만으로 충분한지 구분했는가
- build tool과 package manager도 같은 절차로 검토했는가
