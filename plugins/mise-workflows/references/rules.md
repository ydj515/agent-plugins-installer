# Rules

## Rule Family

- `PARSE*`: TOML parse failure
- `MWC*`: tools, backend, config rules
- `MWE*`: env and local override rules
- `MWT*`: task rules
- `MWV*`: version policy rules
- `MWL*`: lockfile rules
- `MWJ*`: Java selector and vendor policy rules
- `MWP*`: profile inference rules

## 현재 구현된 규칙

| Rule | Severity | Owner | 검사 내용 |
| --- | --- | --- | --- |
| `PARSE001` | error | `mise-review` | TOML parse 실패 |
| `MWC001` | warning | `mise-tools` | `ubi:` backend (2027.1.0 제거) |
| `MWC002` | warning | `mise-tools` | `asdf:` backend |
| `MWC003` | warning | `mise-tools` | `[alias]`, `experimental_monorepo_root` 같은 deprecated top-level 키 |
| `MWE001` | error | `mise-env` | top-level `env_file`, `dotenv`, `env_path` |
| `MWE002` | warning | `mise-env` | local config/lockfile이 `.gitignore`에 없음 |
| `MWE003` | warning | `mise-env` | `env.mise.*` (2026.12.0 제거) |
| `MWE004` | error | `mise-env` | `[env]` 안의 `redactions` |
| `MWE005` | warning | `mise-env` | `python.uv_venv_auto = true` |
| `MWE006` | warning | `mise-env` | `_.python.venv`와 `python.uv_venv_auto` 동시 사용 |
| `MWE007` | warning | `mise-env` | Python `virtualenv` tool option |
| `MWT001` | warning | `mise-tasks` | Tera `arg()`, `option()`, `flag()` (2027.5.0 제거) |
| `MWT002` | policy-error | `mise-tasks` | task에 `description`, `usage`(`about` 포함), `run`(또는 `file`) 중 누락 |
| `MWV002` | policy-error | `mise-policy` | tracked config의 `latest` |
| `MWV003` | warning | `mise-policy` | prerelease로 보이는 request |
| `MWV004` | error | `mise-tools` | `^24`, `>=20` 같은 npm 스타일 range |
| `MWV005` | warning | `mise-policy` | deprecated `install_before` |
| `MWL001` | info | `mise-lock` | 도구가 있는데 `mise.lock`이 없음 |
| `MWL002` | error | `mise-lock` | `lockfile = false`와 `locked = true` 동시 사용 |
| `MWJ001` | policy-error | `mise-tools` | vendor 없는 Java request (`21`, `lts`) |
| `MWP001` | error | `mise-profiles` | `python-uv-app` 신호인데 `python`, `uv` 누락 |
| `MWP002` | error | `mise-profiles` | `java-gradle-app` 신호인데 `java`, `gradle` 누락 |
| `MWP003` | error | `mise-profiles` | `java-spring-service` 신호인데 `java`, `gradle` 누락 |

## 검사 대상 파일

- `mise.toml`, `mise.*.toml`, `.mise.toml`, `.mise.*.toml`
- `.config/mise.toml`, `.config/mise/config.toml`, `mise/config.toml`, `.mise/config.toml`
- `conf.d/*.toml` fragment (`.config/mise/conf.d`, `mise/conf.d`, `.mise/conf.d`)
- `.gitignore`, `mise.lock`, profile 신호 파일(`pyproject.toml`, `uv.lock`, `build.gradle*`, Spring 신호)

## 공식 검사와 함께 쓰기

validator는 조직 정책과 deprecation을 검사한다. mise 자체 검사도 함께 실행한다.

- `mise tasks validate`: 순환 의존, 없는 task 참조, `usage` parse 오류, 잘못된 `timeout`
- `mise doctor`: mise 설치 상태
- `mise doctor project`: 프로젝트가 선언한 `[doctor.checks]`

## 출력 기대치

- JSON과 human-readable 모두 지원
- error 또는 policy-error가 있으면 exit code 1
- 각 진단은 `owner_skill`, `why`, `fix_hint`, `docs`, `evidence`를 포함
- `fix_hint`는 짧고 실행 가능해야 함
- 관련 ecosystem reference가 있다면 `docs`에 함께 준다
