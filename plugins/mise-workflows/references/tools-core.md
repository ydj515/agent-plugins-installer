# Tools Core

## 목적

이 문서는 `mise`의 `[tools]` 섹션을 설계하거나 리뷰할 때 따르는 공통 기준을 정의한다. 언어별 vendor 규칙이나 framework별 예외는 root `references/ecosystems/` 문서에서 다룬다. lockfile 운영은 `references/lockfile.md`가 소유한다.

## 기본 원칙

- 가능한 경우 registry short name(`node`, `python`, `uv`)을 먼저 쓴다. short name이 core tool이면 `core` backend가 자동으로 선택된다.
- `mise`가 직접 해석 가능한 version request만 사용한다.
- version 후보는 `mise ls-remote <tool>` 또는 `mise latest <tool@request>` 결과 안에서만 고른다.
- tracked `mise.toml`에는 `latest`를 직접 저장하지 않는다.
- 사람이 읽기 쉬운 request는 `mise.toml`에 두고, exact resolution은 `mise.lock`으로 관리한다.
- backend를 직접 고를 때는 아래 우선순위를 따른다.

## 도구 범위

`[tools]`는 runtime뿐 아니라 build tool, package manager, CLI 도구도 포함한다. 예:

- runtime: `java`, `python`, `node`
- build tool: `gradle`, `maven`
- package manager / workflow tool: `uv`, `pnpm`
- CLI 도구: `ruff`, `shellcheck`, `"github:owner/repo"`

## Backend 우선순위

공식 문서의 권장 순서를 기준으로 한다. publisher가 직접 만든 prebuilt release를 설치하는 backend를 우선한다.

1. registry short name 또는 core tool
2. `packslip:`: publisher가 서명된 packslip manifest를 배포할 때
3. `aqua:` 또는 `github:`, `gitlab:`, `forgejo:`: forge release asset
4. `http:`, `s3:`: 직접 호스팅하는 archive
5. 언어 패키지 backend(`cargo:`, `go:`, `npm:`, `pypi:`, `gem:`, `dotnet:`): 도구가 패키지로만 배포되거나 extras/features 같은 패키지 옵션이 필요할 때
6. `vfox:` plugin: 설치에 custom logic이 필요할 때만
7. `asdf:`: legacy. Windows 미지원이며 기본 선택으로 쓰지 않는다

`ubi:`는 deprecated이며 mise 2027.1.0에서 제거된다. `github:`(다른 host는 `gitlab:`, `http:`)로 옮긴다.

## Version Request 문법

| 형태 | 예 | 의미 |
| --- | --- | --- |
| exact | `"3.14.8"` | 해당 release |
| prefix | `"3.14"`, `"24"` | prefix로 시작하는 최신 release |
| `latest` | `"latest"` | backend가 latest로 보는 release. tracked config에서는 금지 |
| alias | `"lts"` | alias가 가리키는 request |
| `prefix:` | `"prefix:1.20"` | 같은 이름의 release가 있어도 prefix 매칭 |
| `ref:` 등 | `"ref:main"` | source build를 지원하는 backend에서만 |
| `path:` | `"path:/opt/homebrew/opt/node@24"` | 기존 디렉터리를 설치본으로 사용. 2026.10.9부터 trust 필요 |
| `sub-` | `"sub-1:latest"` | 해석된 버전에서 빼기 연산 |

- prefix와 `latest`는 prerelease를 건너뛴다. prerelease가 꼭 필요하면 exact version이나 `prerelease` tool option을 쓴다.
- `^24`, `>=20` 같은 npm 스타일 range는 지원하지 않는다. mise는 경고 후 literal version으로 취급하고 설치에 실패한다.
- 여러 버전이 필요하면 배열로 적는다. 첫 번째 값이 기본 명령을 제공한다: `python = ["3.14", "3.13"]`.

## Tool Options

- 옵션이 필요하면 table 형식을 쓴다: `[tools.trivy]` 아래 `version = "0.60"`, `minimum_release_age = "1d"`.
- 옵션은 backend에 속한다. `pypi:`가 이해하는 옵션은 `aqua:`에서 의미가 없으므로 backend 문서를 확인한다.
- tool option table과 이름 안 inline option(`"tool[opt=value]"`)은 trust가 필요하다.
- `[tool_config] locked = true`는 이 config root의 도구가 lockfile에서만 해석되도록 강제한다. 자세한 내용은 `references/lockfile.md`를 본다.

## Version File

- `.nvmrc`, `.python-version`, `.java-version` 같은 idiomatic version file은 기본적으로 읽지 않는다. `idiomatic_version_file_enable_tools`에 도구를 추가해야 한다.
- 같은 디렉터리에서 `mise.toml`과 version file이 같은 도구를 선언하면 `mise.toml`이 이긴다. source of truth를 하나로 정한다.
- `.tool-versions`의 도구는 `mise.lock`에 기록되지 않는다. lockfile이 필요하면 `mise.toml`로 옮긴다.

## Backend 확인과 전환

- `mise tool <name> --backend`: short name이 실제로 쓰는 backend
- `mise registry <name>`: registry의 backend 후보 순서
- lockfile에 기록된 backend는 registry가 바뀌어도 유지된다. 전환은 `mise backends switch <tool>`로 명시적으로 한다.

## 검토 체크리스트

- tool 이름이 실제 `mise` registry, core tool, 또는 명시적 backend identifier와 일치하는가
- request가 조직 policy와 profile floor를 만족하는가
- `ubi:` 같은 deprecated backend나 기본 선택으로 쓰인 `asdf:`가 없는가
- npm 스타일 range나 `latest`가 tracked config에 없는가
- version file 전략과 `mise.toml`이 서로 충돌하지 않는가
- runtime, build tool, package manager가 profile과 맞는 조합으로 선언되어 있는가
- lockfile로 재현성을 보장하는지, exact pin이 필요한지 구분했는가

## ecosystem reference map

- Java vendor와 idiomatic file: `references/ecosystems/java-runtime.md`
- Gradle selector와 wrapper 경계: `references/ecosystems/java-gradle.md`
- Python selector와 version file: `references/ecosystems/python-runtime.md`
- uv selector와 Python workflow: `references/ecosystems/python-uv.md`
- Spring 서비스 관례: `references/ecosystems/spring-service.md`
- lockfile 운영: `references/lockfile.md`
