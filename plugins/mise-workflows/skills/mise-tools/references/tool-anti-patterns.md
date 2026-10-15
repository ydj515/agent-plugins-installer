# Tool Anti-Patterns

- registry short name이나 core tool이 있는데 legacy backend부터 고르는 패턴
- deprecated `ubi:` backend를 유지하는 패턴(2027.1.0 제거)
- profile 없이 도구를 임의 조합하는 패턴
- selector floor 없이 지나치게 오래된 major를 유지하는 패턴
- `latest`나 `^24` 같은 npm 스타일 range를 tracked config에 저장하는 패턴
- `mise ls-remote`에 없는 selector를 추측으로 적는 패턴
- registry backend 변경 경고를 무시하고 lockfile을 직접 고치는 패턴
