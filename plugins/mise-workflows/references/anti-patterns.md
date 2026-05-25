# Anti-Patterns

## Tools / Versions

- tracked `mise.toml`에 `latest`를 직접 저장
- `mise ls-remote <tool>`에 나오지 않는 selector를 임의로 적기
- `ubi:` 같은 deprecated backend를 계속 유지
- core tool이 있는데 `asdf:`나 legacy backend부터 고르기
- runtime, build tool, package manager를 profile 없이 뒤섞어 선언하기

## Env / Secrets

- tracked config에 secret이나 사용자 로컬 경로를 직접 넣기
- `env_file`, `dotenv`, `env_path` 같은 deprecated top-level env key 유지
- `.gitignore` 없이 `mise.local.toml` 또는 `mise.*.local.toml`을 추가하기
- `mise exec -- script.py`처럼 실행 경로를 `mise`에 강하게 결합하기
- non-interactive job에서 shell activation만 믿고 secret이 로드될 거라고 가정하기
- `exec()`로 매번 subprocess를 띄워 secret이나 파일 값을 읽기
- SSH 전에 `__MISE_DIFF`를 정리하지 않아 원격 trust 문제를 유발하기

## Tasks

- modern `usage`와 deprecated helper를 혼용하기
- 너무 긴 shell을 TOML 문자열 하나에 몰아넣기
- file task header를 formatter가 깨뜨릴 수 있는 형태로 두기
- task `description`을 비워서 에이전트가 목적을 추론하게 만들기
- long-running remote workflow를 `depends` 체인으로만 연결하기
- publish/release task가 build artifact를 직접 보장하지 않는데도 배포를 허용하기

## Profiles / Ownership

- language/build/package manager 규칙을 profile 안에 직접 섞어 넣기
- 공통 policy를 ecosystem skill에 숨겨 중복 정의하기
- monorepo routing 없이 루트와 하위 `mise.toml`에 같은 선언을 반복하기
