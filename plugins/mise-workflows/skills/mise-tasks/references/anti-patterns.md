# Task Anti-Patterns

- deprecated helper와 modern `usage`를 혼용하는 패턴
- 지나치게 긴 shell을 TOML 문자열 하나에 욱여넣는 패턴
- file task comment가 formatter에 의해 깨지는 패턴
- task `description`이 너무 빈약해 의도를 알 수 없는 패턴
- release/publish가 build artifact를 의존하지 않는 패턴
- 장시간 원격 job을 `depends`만으로 연결하는 패턴
