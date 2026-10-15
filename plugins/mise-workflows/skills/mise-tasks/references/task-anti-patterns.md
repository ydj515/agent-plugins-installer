# Task Anti-Patterns

- `description`, `usage`(`about`), `run` 중 하나라도 빠진 task
- deprecated Tera `arg()`, `option()`, `flag()`와 `usage`를 혼용하는 패턴
- 지나치게 긴 shell을 TOML 문자열 하나에 욱여넣는 패턴
- file task comment가 formatter에 의해 깨지는 패턴
- release/publish가 build artifact를 의존하지 않는 패턴
- 장시간 원격 job을 `depends`만으로 연결하는 패턴
- `:`가 들어간 task 이름을 따옴표 없이 TOML 키로 쓰는 패턴
- monorepo에서 `experimental_monorepo_root`나 자동 탐색에 의존하는 패턴
- `[tools]`와 같은 버전인데 `mise exec node@24 -- npm test`처럼 감싸는 패턴(prefix가 다른 설치 버전으로 해석되어 `[tools]` 고정이 무시될 수 있음)
