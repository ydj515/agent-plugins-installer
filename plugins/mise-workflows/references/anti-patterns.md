# Anti-Patterns

## Tools / Versions

- tracked `mise.toml`에 `latest`를 직접 저장
- `^24`, `>=20` 같은 npm 스타일 range를 request로 쓰기(literal로 취급되어 설치 실패)
- `mise ls-remote <tool>`에 나오지 않는 request를 임의로 적기
- `ubi:` 같은 deprecated backend를 계속 유지(2027.1.0 제거)
- registry short name이나 core tool이 있는데 `asdf:`나 plugin부터 고르기
- runtime, build tool, package manager를 profile 없이 뒤섞어 선언하기
- `minimum_release_age`를 근거 없이 `0s`로 끄기, 또는 deprecated `install_before` 유지
- `[alias]`, `experimental_monorepo_root` 같은 deprecated top-level 키 유지

## Lockfile

- 팀 저장소에서 `mise.lock` 없이 prefix request만 두기
- `mise.local.lock`이나 `.mise/locks/mise.local` 디렉터리를 커밋하기
- CI에서 `--locked` 없이 설치해 lockfile 누락을 놓치기
- checksum mismatch를 lockfile entry 삭제로 우회하기
- 신뢰하지 않는 branch에서 lockfile bump bot을 safe mode 없이 실행하기

## Env / Secrets

- tracked config에 secret이나 사용자 로컬 경로를 직접 넣기
- `env_file`, `dotenv`, `env_path`, `env.mise.*` 같은 deprecated env 키 유지
- `redactions`를 `[env]` 안에 넣기(top-level 키)
- `.gitignore` 없이 `mise.local.toml` 또는 `mise.*.local.toml`을 추가하기
- `mise exec -- script.py`처럼 실행 경로를 `mise`에 강하게 결합하기
- non-interactive job에서 shell activation만 믿고 secret이 로드될 거라고 가정하기
- `exec()`로 매번 subprocess를 띄워 secret이나 파일 값을 읽기
- `python.uv_venv_auto = true`(deprecated)와 `_.python.venv`를 함께 선언하기
- Tera v1 전용 helper(`trim_start_matches`, `as_str` 등)를 새 template에 쓰기
- SSH 전에 `__MISE_DIFF`를 정리하지 않아 원격 trust 문제를 유발하기

## Tasks

- `usage` spec과 deprecated Tera `arg()`, `option()`, `flag()`를 혼용하기
- 너무 긴 shell을 TOML 문자열 하나에 몰아넣기
- file task header를 formatter가 깨뜨릴 수 있는 형태로 두기
- task `description`을 비워서 에이전트가 목적을 추론하게 만들기
- long-running remote workflow를 `depends` 체인으로만 연결하기
- publish/release task가 build artifact를 직접 보장하지 않는데도 배포를 허용하기
- `:`가 들어간 task 이름을 따옴표 없이 TOML 키로 쓰기
- `[tools]`와 같은 버전을 쓰는 task 명령을 `mise exec <tool>@<version> --`로 감싸기

## Profiles / Ownership

- language/build/package manager 규칙을 profile 안에 직접 섞어 넣기
- 공통 policy를 ecosystem reference에 숨겨 중복 정의하기
- monorepo routing 없이 루트와 하위 `mise.toml`에 같은 선언을 반복하기
