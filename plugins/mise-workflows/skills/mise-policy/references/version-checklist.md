# Version Policy Checklist

## 공통 판단

- `mise ls-remote` 또는 `mise latest`로 해석 가능한가
- prerelease가 아닌가
- `minimum_release_age`를 통과하는가(lockfile에 기록된 버전은 예외)
- selector floor를 만족하는가
- release age 완화나 제외에 사유가 남아 있는가

## 출력 기대치

- `mise.toml`에는 request 중심
- `mise.lock`에는 exact resolution 중심
- 조직 기본 release age를 바꾼다면 `[settings] minimum_release_age`에 둔다
