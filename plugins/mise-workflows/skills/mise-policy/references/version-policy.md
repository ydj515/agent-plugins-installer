# Version Policy Checklist

## 공통 판단

- `mise ls-remote` 또는 `mise latest`로 해석 가능한가
- prerelease가 아닌가
- age gate를 통과하는가
- selector floor를 만족하는가

## 출력 기대치

- `mise.toml`에는 selector 중심
- `mise.lock`에는 exact resolution 중심
