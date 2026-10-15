# Lockfile

## 목적

이 문서는 `mise.lock`으로 도구 버전을 재현 가능하게 고정하는 운영 기준을 정리한다. 애플리케이션 의존성 lockfile(`uv.lock`, `package-lock.json`)은 별개이며 함께 유지한다.

## 기본 원칙

- `mise.toml`에는 사람이 읽는 request, `mise.lock`에는 exact version, URL, checksum을 둔다.
- 팀 저장소는 `mise.lock`을 커밋한다. 의존성 그래프 sidecar(`.mise/locks` 디렉터리)가 생기면 함께 커밋한다.
- CI와 Docker는 `mise install --locked`로 설치한다.
- lockfile 변경은 코드 변경처럼 리뷰한다. provenance 정보가 있는 lockfile은 신뢰 입력이 된다.

## 만들기

```toml
[settings]
lockfile = true
```

- `lockfile = true`: lockfile을 만들고 갱신한다.
- 미설정: 기존 lockfile만 갱신하고 새로 만들지 않는다. `mise lock`으로 직접 만든다.
- `lockfile = false`: lockfile을 끈다. `locked = true`와 함께 쓰면 오류다.
- `mise lock`은 아무것도 설치하지 않고 현재 config root의 도구(task `tools` 포함)를 해석해 기록한다.
- `.tool-versions`에만 있는 도구는 기록되지 않는다.

## 어떤 lockfile을 쓰는가

| 도구 선언 위치 | lockfile | 커밋 |
| --- | --- | --- |
| `mise.toml` | `mise.lock` | 예 |
| `mise.<env>.toml` | `mise.<env>.lock` | 예 |
| `mise.local.toml` | `mise.local.lock` | 아니오 |
| `mise.<env>.local.toml` | `mise.<env>.local.lock` | 아니오 |
| global config | `mise lock --global`로 만든 `mise.lock` | 설정 저장소에 둘 때만 |
| monorepo 하위 프로젝트(`[monorepo] lockfile = true`) | root의 같은 이름 lockfile | 예 |

`mise.local.lock`을 ignore하면 sidecar 디렉터리 `.mise/locks/mise.local` 디렉터리도 ignore한다.

## 플랫폼

URL을 기록하는 backend는 설치하는 모든 플랫폼의 entry가 필요하다.

```sh
mise lock --platform linux-x64,linux-arm64,macos-arm64
```

`lockfile_platforms` setting으로 기본 플랫폼 목록을 정할 수 있다.

## 갱신

| 목표 | 명령 |
| --- | --- |
| request를 바꾸고 설치 | `mise use node@26` |
| request 범위 안 최신으로 설치하고 lockfile 갱신 | `mise upgrade node` |
| 설치 없이 lockfile만 최신 허용 버전으로 | `mise lock --bump node` |
| prefix request는 두고 exact version 고정 | `mise lock node@24.11.0` |
| lockfile대로 설치 | `mise install --locked` |

자동 업데이트 bot은 `MISE_SAFE=1 mise lock --bump --json`으로 실행해 저장소 config가 코드를 실행하지 못하게 한다.

## Strict Mode

- `mise install --locked` 또는 `MISE_LOCKED=1`: lockfile에 entry가 없으면 실패한다.
- `[tool_config] locked = true`: 이 config root의 도구에 lockfile을 강제한다. 프로젝트 단위 정책에 쓴다.
- `locked_scopes`는 global config에서만 설정할 수 있다.

## Monorepo

```toml
monorepo_root = true

[monorepo]
config_roots = ["packages/api", "packages/web"]
lockfile = true
```

- `lockfile = true`면 하위 프로젝트 도구가 root lockfile에 모인다.
- 미설정 상태로 하위 lockfile이 있으면 2026.12.0부터 경고하고, 2027.6.0부터 root lockfile이 기본이 된다.
- 오래된 mise를 지원해야 하면 `lockfile = false`로 기존 배치를 유지한다.

## Backend 변경

registry가 도구의 backend를 바꿔도 lockfile에 기록된 backend가 유지된다. 경고가 나오면 `mise backends switch <tool>`로 명시적으로 옮기고 diff를 리뷰한다.

## 문제 해결

- checksum mismatch: 의도된 upstream 변경인지 확인한 뒤 `mise lock <tool>`로 해당 entry만 갱신한다. checksum 삭제로 우회하지 않는다.
- `No tools configured to lock`: 도구가 global config나 `.tool-versions`에만 있는지 확인한다.
- merge conflict: `mise.toml`을 먼저 정리하고, lockfile은 한쪽을 택한 뒤 `mise lock`으로 다시 쓴다.

## Minimum Release Age와의 관계

lockfile에 기록된 버전은 `minimum_release_age` 안쪽이어도 설치된다. cutoff는 새 버전을 고를 때만 적용된다.

## 검토 질문

- `mise.lock`과 필요한 sidecar가 커밋되어 있는가
- 개발자와 CI가 쓰는 모든 플랫폼 entry가 있는가
- local lockfile이 ignore되어 있는가
- CI가 `--locked`로 설치하는가
- monorepo라면 root lockfile 정책을 명시했는가
